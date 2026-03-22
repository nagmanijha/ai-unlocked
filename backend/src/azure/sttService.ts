import { logger } from '../config/logger';
import { config } from '../config';
import { CallSession } from './callSession';

/**
 * Phase 2 — Checkpoint 3: Real-Time STT & Language Identification
 *
 * Azure AI Speech SDK integration for:
 * 1. Real-time Speech-to-Text using PushAudioInputStream
 * 2. Automatic Language Identification for 8 Indian languages
 * 3. Event-driven endpointing (silence detection → trigger pipeline)
 *
 * ARCHITECTURE:
 * - Uses PushAudioInputStream so we can feed raw PCM bytes from ACS WebSocket
 * - AutoDetectSourceLanguageConfig dynamically switches the STT model
 * - "recognized" event fires when user finishes speaking (endpointing)
 *
 * Falls back to mock STT when Azure Speech credentials are not configured.
 */

// Supported Indian languages for AutoDetect Language ID
const SUPPORTED_LANGUAGES = [
    'en-IN',  // English (India)
    'hi-IN',  // Hindi
    'ta-IN',  // Tamil
    'te-IN',  // Telugu
    'kn-IN',  // Kannada
    'ml-IN',  // Malayalam
    'bn-IN',  // Bengali
    'mr-IN',  // Marathi
];

export interface STTResult {
    text: string;
    language: string;
    confidence: number;
}

export type STTCallback = (result: STTResult) => void;
export type SpeechStartCallback = () => void;

class STTService {
    private speechKey: string;
    private speechRegion: string;

    constructor() {
        this.speechKey = config.speech?.key || '';
        this.speechRegion = config.speech?.region || '';
    }

    /**
     * Create a real-time STT recognizer bound to a CallSession.
     *
     * When Azure Speech SDK is available:
     *   - Creates a PushAudioInputStream for feeding PCM from ACS
     *   - Configures AutoDetectSourceLanguage for all 8 languages
     *   - Attaches "recognizing" (interim) and "recognized" (final) events
     *
     * Returns a controller object with methods to push audio and stop.
     */
    createRecognizer(
        session: CallSession,
        onRecognized: STTCallback,
        onSpeechStart?: SpeechStartCallback
    ): STTController {
        if (!this.speechKey || !this.speechRegion) {
            logger.warn('[STT] Azure Speech not configured — using mock recognizer');
            return new MockSTTController(session, onRecognized, onSpeechStart);
        }

        return new AzureSTTController(
            this.speechKey,
            this.speechRegion,
            session,
            onRecognized,
            onSpeechStart
        );
    }
}

/**
 * Interface for STT controllers (real and mock).
 */
export interface STTController {
    /** Feed raw PCM audio bytes (16kHz, 16-bit, mono) */
    pushAudio(pcmBuffer: Buffer): void;
    /** Stop the recognizer and release resources */
    stop(): Promise<void>;
}

/**
 * Production Azure Speech SDK controller.
 * Uses the microsoft-cognitiveservices-speech-sdk package.
 */
class AzureSTTController implements STTController {
    private audioStream: any = null;
    private recognizer: any = null;
    private session: CallSession;

    constructor(
        speechKey: string,
        speechRegion: string,
        session: CallSession,
        onRecognized: STTCallback,
        onSpeechStart?: SpeechStartCallback
    ) {
        this.session = session;

        try {
            // Dynamic import to avoid crash if SDK not installed
            const sdk = require('microsoft-cognitiveservices-speech-sdk');

            // Create push stream for feeding PCM audio
            const format = sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);
            this.audioStream = sdk.AudioInputStream.createPushStream(format);

            const audioConfig = sdk.AudioConfig.fromStreamInput(this.audioStream);

            const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
            speechConfig.setProperty(
                sdk.PropertyId.SpeechServiceConnection_LanguageIdMode,
                'Continuous'
            );

            // AGGRESSIVE ENDPOINTING: Reduce the wait time for silence detection
            // to just 500ms, shaving off nearly a full second of latency.
            speechConfig.setProperty(
                sdk.PropertyId.Speech_SegmentationSilenceTimeoutMs,
                '500'
            );
            speechConfig.setProperty(
                sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
                '500'
            );
            speechConfig.setProperty(
                sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
                '3000'
            );

            if (session.isLanguageLocked && session.language) {
                // If language was explicitly selected in the UI, bypass AutoDetect completely
                // This shaves off ~500-1000ms of language confidence calculation!
                speechConfig.speechRecognitionLanguage = session.language;
                this.recognizer = new sdk.SpeechRecognizer(
                    speechConfig,
                    audioConfig
                );
            } else {
                // Auto-detect from all 8 supported Indian languages
                const autoDetectConfig = sdk.AutoDetectSourceLanguageConfig.fromLanguages(
                    SUPPORTED_LANGUAGES
                );
                
                this.recognizer = sdk.SpeechRecognizer.FromConfig(
                    speechConfig,
                    autoDetectConfig,
                    audioConfig
                );
            }

            // ── Event: Interim results (user is speaking) ──
            this.recognizer.recognizing = (_sender: any, event: any) => {
                const text = event.result.text;
                if (text) {
                    logger.debug(`[STT:Interim] ${text}`);
                    if (onSpeechStart) onSpeechStart();
                }
            };

            // ── Event: Final result (endpointing — user stopped speaking) ──
            this.recognizer.recognized = (_sender: any, event: any) => {
                const result = event.result;
                
                if (result.reason === sdk.ResultReason.RecognizedSpeech && result.text) {
                    let detectedLang = session.language;
                    
                    if (!session.isLanguageLocked) {
                        try {
                            const langResult = sdk.AutoDetectSourceLanguageResult.fromResult(result);
                            if (langResult?.language) {
                                detectedLang = langResult.language;
                            }
                        } catch (err) {
                            // Ignored: parsing fails natively if the stream isn't flagged for AutoDetect
                        }
                    }

                    onRecognized({
                        text: result.text,
                        language: detectedLang,
                        confidence: result.properties?.getProperty('SpeechServiceResponse_JsonResult')
                            ? 0.9 : 0.8,
                    });
                } else if (result.reason === sdk.ResultReason.NoMatch) {
                    logger.debug(`[STT] No Match (Silence or Unintelligible). Details: ${result.errorDetails || 'None'}`);
                } else {
                    logger.debug(`[STT] Recognized reason: ${result.reason}`);
                }
            };

            // ── Event: Canceled (Errors, Auth failures, invalid region) ──
            this.recognizer.canceled = (_sender: any, event: any) => {
                logger.error(`[STT] Recognition CANCELED for session ${session.sessionId}`, {
                    reason: event.reason,
                    errorCode: event.errorCode,
                    errorDetails: event.errorDetails,
                });
            };

            // ── Event: Session Stopped (Connection closed) ──
            this.recognizer.sessionStopped = (_sender: any, event: any) => {
                logger.info(`[STT] Session STOPPED for session ${session.sessionId}`);
            };

            // Start continuous recognition
            this.recognizer.startContinuousRecognitionAsync(
                () => logger.info(`[STT] Started continuous recognition for session ${session.sessionId}`),
                (err: any) => logger.error('[STT] Failed to start recognition', err)
            );

        } catch (error) {
            logger.error('[STT] Failed to initialize Azure Speech SDK', error);
            // Degrade to a no-op controller
            this.recognizer = null;
        }
    }

    private _firstPacketLogged = false;

    pushAudio(pcmBuffer: Buffer): void {
        if (this.audioStream) {
            if (!this._firstPacketLogged) {
                logger.info(`[STT] Feeding audio to Azure stream for the first time...`);
                this._firstPacketLogged = true;
            }
            
            // Feed raw PCM bytes directly to the push stream
            // ACS sends 16kHz, 16-bit, mono PCM — exactly what Speech SDK expects
            this.audioStream.write(pcmBuffer.buffer.slice(
                pcmBuffer.byteOffset,
                pcmBuffer.byteOffset + pcmBuffer.byteLength
            ));
        }
    }

    async stop(): Promise<void> {
        return new Promise((resolve) => {
            if (this.recognizer) {
                this.recognizer.stopContinuousRecognitionAsync(
                    () => {
                        this.audioStream?.close();
                        this.recognizer?.close();
                        this.recognizer = null;
                        this.audioStream = null;
                        resolve();
                    },
                    (err: any) => {
                        logger.error('[STT] Error stopping recognition', err);
                        resolve();
                    }
                );
            } else {
                resolve();
            }
        });
    }
}

/**
 * Mock STT controller for local development.
 *
 * Simulates endpointing by returning pre-defined responses that match
 * the curriculum/scheme context after receiving 100 packets (2 seconds).
 * Blocks further processing for 10 seconds to allow the AI to reply.
 */
class MockSTTController implements STTController {
    private session: CallSession;
    private onRecognized: STTCallback;
    private onSpeechStart?: SpeechStartCallback;
    private packetCount: number = 0;
    private speechStarted: boolean = false;
    private hasRecognized: boolean = false;

    private mockResponses: Array<{ text: string; language: string }> = [
        { text: 'What is photosynthesis?', language: 'en-IN' },
        { text: 'Pradhan Mantri Awas Yojana ke baare mein batao', language: 'hi-IN' },
        { text: "Newton's third law explain karo", language: 'hi-IN' },
        { text: 'Solar system mein kitne planets hain?', language: 'en-IN' },
        { text: 'Pani ka cycle kya hota hai?', language: 'hi-IN' },
    ];
    private responseIndex: number = 0;

    constructor(session: CallSession, onRecognized: STTCallback, onSpeechStart?: SpeechStartCallback) {
        this.session = session;
        this.onRecognized = onRecognized;
        this.onSpeechStart = onSpeechStart;
    }

    pushAudio(pcmBuffer: Buffer): void {
        if (this.hasRecognized) return;

        this.packetCount++;

        // Simulate "speech start" after first few packets
        if (this.packetCount === 3 && !this.speechStarted && this.onSpeechStart) {
            this.speechStarted = true;
            this.onSpeechStart();
        }

        // Endpointing after 2 seconds of audio (100 packets at 20ms each)
        if (this.packetCount > 100) {
            this.hasRecognized = true;
            const mock = this.mockResponses[this.responseIndex % this.mockResponses.length];
            this.responseIndex++;
            this.speechStarted = false;

            this.onRecognized({
                text: mock.text,
                language: mock.language,
                confidence: 0.92,
            });

            // Wait 10 seconds before allowing the next mock turn
            setTimeout(() => {
                this.hasRecognized = false;
                this.packetCount = 0;
            }, 10000);
        }
    }

    async stop(): Promise<void> {
        this.packetCount = 0;
        this.hasRecognized = false;
    }
}

export const sttService = new STTService();
