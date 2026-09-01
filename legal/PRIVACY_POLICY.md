# Privacy Policy — Project Jarvis

**Effective Date:** September 1, 2026  
**Last Updated:** September 1, 2026

## 1. Introduction
Project Jarvis ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how our privacy-first personal AI assistant and vision companion handles your data.

## 2. Privacy-First Architecture & Local Execution
Unlike traditional cloud-based AI assistants, Project Jarvis is engineered with a **local-first, privacy-first architecture**:
- **Local AI Inference:** Speech-to-text transcription (Whisper) and text-to-speech synthesis (Piper) execute locally on your machine or private infrastructure.
- **Data Sovereignty:** No voice recordings, transcripts, or video feeds leave your device unless you explicitly opt in to optional cloud-based providers (e.g., OpenAI, Anthropic, Google Gemini, or Deepgram).

## 3. Data Collection
When using Project Jarvis, we collect minimal data required to maintain assistant state and session memory:
- **Conversation History & Memory:** Stored locally in encrypted browser storage (`localStorage`) and local vector/JSON memory stores (Mem0).
- **Configuration & Settings:** User preferences (voice settings, system prompts, theme, and API keys) are stored strictly on your local device.

## 4. Third-Party Services & Cloud Fallbacks
If you explicitly configure cloud API keys (such as OpenAI, Anthropic, or Google) or cloud STT/TTS (Deepgram) in the Settings panel:
- Data transmitted to those third-party providers is governed by their respective privacy policies.
- We do not store or monetize your API keys or conversational transcripts on remote servers.

## 5. Security Measures
We implement industry-standard container security hardening, non-root execution, and strict network isolation to protect your local environment against unauthorized access.

## 6. Contact
For legal, privacy, or compliance inquiries, please submit an advisory through private repository channels.
