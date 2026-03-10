# AskBox: Official 3-Minute Video Demo Script

**Target Duration**: 180 Seconds (~450 Words)
**Tone**: Professional, technical, and mission-driven.

---

### Phase 1: The Problem (0:00 - 0:45)
**[Visual: Split screen — Left: A student in a rural village with a basic phone. Right: The AskBox Admin Dashboard "Live" view.]**

"Hello. I'm Nagmani Jha, and this is **AskBox** — a real-time, voice-first AI gateway designed for the 500 million people in rural India who lack smartphones and reliable 4G. 

In these communities, the biggest barrier to education and welfare isn't just the internet; it’s language and interface. Asking a question about a government scheme or a Class 10 science concept shouldn't require an app. With AskBox, it only requires a phone call."

---

### Phase 2: Technical Excellence (0:45 - 1:45)
**[Visual: Transition to a high-fidelity "AskBox Architecture" diagram. Highlight the Real-Time Pipeline.]**

"To power this, we've built a high-throughput pipeline on **AMD-optimized infrastructure**. Every call is a bidirectional WebSocket stream via **Azure Communication Services**.

We’ve solved three critical 'last-mile' challenges:
1. **Inclusive Speech-to-Text**: Using **Azure AI Speech**, we support 8 Indian languages with automatic language detection. We’ve implemented a custom **3-second inactivity trigger** to ensure the system respects the slower speech patterns typical of rural users.
2. **Deterministic RAG**: We don't just 'hallucinate'. We use **Azure AI Search** for semantic retrieval against NCERT textbooks and government PDFs, with a **Redis cache** layer for sub-5ms response on common queries.
3. **The Low-Latency Brain**: We stream chunks from **Google Gemini** or GPT-4o. By using **sentence-boundary chunking**, we feed the **Azure Neural TTS** the moment a thought is complete, rather than waiting for the full response."

---

### Phase 3: The Live "Handshake" (1:45 - 2:30)
**[Visual: Toggle to a split-screen view. Left: Terminal running `node backend/test_pipeline.js`. Right: The Dashboard's "Live Analytics" updating.]**

"Let's see the handshake in action. **[Action: Run the script]**

Observe the terminal. The moment the user stops speaking — exactly after our 3-second silence rule — the pipeline fires. 
**[Action: Point to the 'StopAudio' and 'AbortController' logs]**

One of our standout features is **Barge-in Protection**. If a user interrupts the AI, our system detects the speech start, sends a `StopAudio` signal to the caller's phone, and uses a Node.js **AbortController** to instantly kill the LLM stream and TTS buffer. This makes the conversation feel truly human, not like a pre-recorded menu."

---

### Phase 4: Impact & Scaling (2:30 - 3:00)
**[Visual: Show the "Analytics" tab with a map of India and call distribution charts.]**

"Finally, all telemetry is logged asynchronously to **Azure Cosmos DB**. We track latency, TTFB, and specific schemes accessed, giving policymakers a real-time heat map of what rural India is asking.

We’ve moved beyond the prototype. AskBox is a functional, demo-ready bridge to the future of inclusive AI. 

Thank you."

---

### 🎬 Production Tips for the Recording
1. **Audio First**: Use a good microphone. Clear audio is 70% of a good demo.
2. **Zoom In**: In VS Code, use `Ctrl + +` so the logs are readable.
3. **Smooth Transitions**: Use OBS to switch between your slide deck and the live dashboard.
4. **The "Aha!" Moment**: Make sure to demonstrate yourself (or the script) interrupting the AI to show the barge-in working.
