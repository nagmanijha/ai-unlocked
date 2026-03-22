#!/usr/bin/env python3
"""
End-to-End Latency & Pipeline Test Script
-------------------------------------------
This script tests the ACS WebSocket audio processing pipeline.
It connects to the local AskBox backend, streams mock audio packets,
and records the Time-To-First-Byte (TTFB) of the AI's audio response.

Requirements:
pip install websockets asyncio time
"""

import asyncio
import websockets
import json
import base64
import time
import uuid

# Backend Configuration
WS_URL = "ws://localhost:5000/acs-audio"

async def test_audio_pipeline():
    print(f"[*] Connecting to {WS_URL} ...")
    call_id = f"test_call_{uuid.uuid4().hex[:8]}"
    uri = f"{WS_URL}/{call_id}"

    start_time = time.time()
    
    try:
        async with websockets.connect(uri) as websocket:
            print(f"[+] Connected to ACS Pipeline. Call ID: {call_id}")
            
            # Send 60 "audio chunks" to simulate a 3-second user utterance (20ms frames)
            print("[*] Simulating user speaking (sending audio packets)...")
            
            # 1. Sending Mock Audio stream
            # The backend is expecting `{"kind": "AudioData", "audioData": {"data": "<base64>"}}`
            for i in range(60):
                dummy_pcm = b"\x00" * 320  # Mock 16kHz 20ms frame
                payload = {
                    "kind": "AudioData",
                    "audioData": {
                        "data": base64.b64encode(dummy_pcm).decode('utf-8')
                    }
                }
                await websocket.send(json.dumps(payload))
                await asyncio.sleep(0.01) # Accelerated simulation

            print("[*] Stream complete. Waiting for STT -> RAG -> GPT-4o -> TTS response pipeline...")
            
            # Record when we finish sending the request to measure exact TTFB
            request_complete_time = time.time()
            
            # 2. Wait for First Byte of response (TTFB)
            first_byte_received = False
            response_chunks = 0
            
            while True:
                try:
                    # Wait for server response with a timeout
                    response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    
                    if not first_byte_received:
                        ttfb = (time.time() - request_complete_time) * 1000
                        print(f"==================================================")
                        print(f"[SUCCESS] 🚀 First Byte Received!")
                        print(f"[METRIC] Time To First Byte (TTFB): {ttfb:.2f} ms")
                        print(f"==================================================")
                        first_byte_received = True
                        
                    data = json.loads(response)
                    if data.get('kind') == 'AudioData':
                        response_chunks += 1
                        print(f"[Data] Received AI audio chunk #{response_chunks} " 
                              f"({len(data['audioData']['data'])} bytes)")
                        
                except asyncio.TimeoutError:
                    print("[*] Stream ended / Timeout reached.")
                    break
            
            print(f"[✓] Test completed successfully. Total AI audio chunks received: {response_chunks}")
            
    except ConnectionRefusedError:
        print("[-] Connection refused. Ensure the Node.js backend is running on port 5000.")
    except Exception as e:
        print(f"[-] Error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(test_audio_pipeline())
