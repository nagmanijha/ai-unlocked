import { CallSession } from './callSession';
export interface STTResult {
    text: string;
    language: string;
    confidence: number;
}
export type STTCallback = (result: STTResult) => void;
export type SpeechStartCallback = () => void;
declare class STTService {
    private speechKey;
    private speechRegion;
    constructor();
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
    createRecognizer(session: CallSession, onRecognized: STTCallback, onSpeechStart?: SpeechStartCallback): STTController;
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
export declare const sttService: STTService;
export {};
//# sourceMappingURL=sttService.d.ts.map