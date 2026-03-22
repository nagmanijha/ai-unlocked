# AskBox: 3-Minute Phase 3 Demo Video Script

**Target Duration:** ~3 Minutes (approx. 400-450 words)
**Pace:** Confident, professional, and focused on demonstrating a *working* MVP for the "AI Unlocked" stage.
**Mission:** Transitioning from "Initial Prototype" to the Top 50 by proving feasibility and strong technical integration.

---

### [0:00 - 0:45] The Heart: India's Connectivity Divide (approx. 90 words)
**[Visual Cue: Start with a brief slide showing the "AskBox" logo, the problem statement, and a mockup of a basic feature phone (like a Nokia 1100) next to a farmer. Gently transition to the AskBox Admin Dashboard.]**

"Hello judges, we are Team Node. For the Microsoft AI Unlocked Hackathon, we are proud to present our Phase 3 working prototype: **AskBox**. 

In rural India, millions are caught in the digital divide. They lack 4G connectivity, reliable internet, and smartphones—creating a massive barrier to accessing crucial information like local school curriculums or agricultural government schemes. 

Our solution is a 'telephony-first' AI gateway. Users simply dial a toll-free number from a basic feature phone, bypassing the need for apps, internet, or typing. They converse natively in their regional dialect. It’s inclusive AI over standard telephony."

---

### [0:45 - 1:45] The Architecture & End-to-End Handshake (approx. 130 words)
**[Visual Cue: Briefly show a crisp, professional architecture diagram highlighting Azure services and AMD hardware. Then tile the screen: Left half showing the Admin Dashboard, Right half showing VS Code/Terminal.]**

"Let's look at the technical handshake making this possible. 

Our entry point is **Azure Communication Services (ACS)**, which captures the standard PSTN call. Because voice requires ultra-low latency, we stream the raw audio over WebSockets directly to our orchestrator running on **AMD-powered servers**. 

From there, we trigger the 'Ear' of our platform: **Azure AI Speech** instantly transcribes the rural dialect into text. 

For the 'Brain', we aren't just using a generalized wrapper. We execute a Retrieval-Augmented Generation (RAG) pattern. We perform semantic similarity matching against **Azure AI Search** to pull hyper-local, verified scheme data. 

This context is passed to **Azure OpenAI GPT-4o** to reason and formulate an accurate, localized response."

---

### [1:45 - 2:30] The Live Demo & MVP Evidence (approx. 110 words)
**[Visual Cue: Execute `node test_pipeline.js` or your live calling interface. Emphasize the terminal logs racing down the screen as the pipeline processes.]**

"To prove this is a functional MVP, I’m running our end-to-end simulated pipeline. This replicates a live incoming call from a rural user. 

**[Visual Cue: Highlight or point to the specific log lines: `[STT]`, `[RAG]`, `[Pipeline] TTFB`]**

As you see in the terminal logs, our orchestrator instantly processes the audio buffer. Notice the pipeline markers: Azure AI Speech triggers, our RAG system validates the local scheme, and GPT-4o streams the chunks back. 

Pay close attention to the sub-second latency of our streaming pipeline. To achieve our fast Time-to-First-Byte, we chunk the GPT-4o output at sentence boundaries. The moment the first sentence is generated, **Azure Neural Text-to-Speech (TTS)** synthesizes it in a natural regional voice and streams it directly back to the handset."

---

### [2:30 - 3:00] The Conclusion & Inclusive Mission (approx. 80 words)
**[Visual Cue: Switch the Dashboard view to the "Analytics" tab showing live call metrics writing to Cosmos DB. Finally, end on a closing slide with the team name and "AskBox: Inclusive AI".]**

"Finally, we handle our telemetry asynchronously. Call metrics, language distribution, and topics are non-blocking and logged securely to **Azure Cosmos DB**, providing real-time deployment analytics without disrupting the active voice threads.

With AskBox, we've demonstrated that our approach is technically sound and highly scalable. We are bringing the frontier of GPT-4o to the last mile, proving that cutting-edge, inclusive AI can—and should—reach the most underserved communities. 

Thank you."

---

### 🎥 Final Recording Checklist
- [ ] Rehearse to ensure the pace feels natural and hits the ~3-minute mark.
- [ ] Maximize terminal font size so the judges can read the `[STT]` and `[RAG]` logs.
- [ ] Spin up the backend and frontend (`npm run dev`) prior to hitting record.
- [ ] Use OBS Studio or Windows Snipping Tool to record. Capture your webcam in the corner to build rapport!
- [ ] Upload to YouTube as "Unlisted" and double-check audio balancing.
