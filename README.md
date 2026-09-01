# Project Jarvis

A privacy-first, voice-enabled personal AI assistant powered by LiveKit and cloud LLMs (OpenAI / Gemini / Anthropic).

## Architecture

```
Browser (Next.js) ←→ LiveKit Server ←→ Python Agent ←→ Cloud LLM
                                              ↕
                                    Whisper (STT) + Piper (TTS)
```

Everything runs locally. No data leaves your machine.

## Quick Start

### Prerequisites
- Docker + Docker Compose
- Node.js 20+

### 1. Start the stack

```bash
docker compose up -d
```

This starts:
- Whisper STT service (localhost:9000)
- Piper TTS service (localhost:5000)
- Jarvis voice agent (connects to LiveKit Cloud via `LIVEKIT_URL`)

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Start the Next.js dev server

```bash
npm run dev
```

### 4. Open and connect

1. Go to http://localhost:3000
2. Click **Connect** in the bottom dock
3. Allow microphone access
4. Speak or type to interact with Jarvis

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Copy `.env.example` to `.env.local`, then fill in your real LiveKit Cloud key/secret and (optionally)
your Gemini/Anthropic/Deepgram/Mem0 keys. Whisper and Piper run locally with no keys.

## Development

```bash
# Start only infrastructure services
docker compose up -d whisper piper-tts jarvis-agent

# Start Next.js dev server (with hot reload)
npm run dev
```

## Production

```bash
# Build and start everything
docker compose up --build -d
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Voice Transport | LiveKit Cloud (WebRTC) |
| Voice Agent | Python, LiveKit Agents SDK |
| LLM | Cloud LLM (OpenAI / Gemini 3 / Anthropic) |
| Speech-to-Text | Whisper (local) or Deepgram (free tier) |
| Text-to-Speech | Piper (local) or Deepgram (free tier) |
| Infrastructure | Docker Compose |

## License

Private — not for distribution.
