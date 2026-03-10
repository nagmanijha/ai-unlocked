from flask import Flask, request, send_file
from TTS.api import TTS
import tempfile
import os

app = Flask(__name__)

# Initialize TTS Model
print("Loading Coqui TTS model...")
tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False)
print("Model loaded successfully!")

@app.route('/api/tts', methods=['GET'])
def synthesize():
    text = request.args.get('text', '')
    if not text:
        return "Missing text parameter", 400

    print(f"Synthesizing: {text}")
    
    # Create temporary file
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, f"tts_{os.urandom(8).hex()}.wav")
    
    try:
        tts.tts_to_file(text=text, file_path=temp_path)
        return send_file(temp_path, mimetype='audio/wav')
    except Exception as e:
        print(f"Error: {e}")
        return str(e), 500
    finally:
        # Note: In a real app we'd clean up the file later, 
        # but send_file needs the file to exist during transfer.
        pass

if __name__ == '__main__':
    app.run(port=5002, host='0.0.0.0')
