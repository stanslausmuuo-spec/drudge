# Project Jarvis

A privacy-first, voice-enabled personal AI assistant powered by LiveKit, Ollama, and local speech models.

## Architecture

```
Browser (Next.js) ←→ LiveKit Server ←→ Python Agent ←→ Ollama (LLM)
                                              ↕
                                    Whisper (STT) + Piper (TTS)
```

Everything runs locally. No data leaves your machine.

## Quick Start

### Prerequisites
- Docker + Docker Compose
- Node.js 20+
- ~4GB RAM (for Ollama + agent)

### 1. Start the stack

```bash
docker compose up -d
```

This starts:
- LiveKit server (localhost:7880)
- Ollama LLM server (localhost:11434)
- Whisper STT service (localhost:9000)
- Piper TTS service (localhost:5000)
- Jarvis voice agent (connects to LiveKit)

### 2. Pull an Ollama model

```bash
docker exec -it jarvis-ollama ollama pull llama3.1
```

### 3. Install frontend dependencies

```bash
npm install
```

### 4. Start the Next.js dev server

```bash
npm run dev
```

### 5. Open and connect

1. Go to http://localhost:3000
2. Click **Connect** in the bottom dock
3. Allow microphone access
4. Speak or type to interact with Jarvis

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Default values work for local development. See `.env.example` for all options.

## Development

```bash
# Start only infrastructure services
docker compose up -d livekit-server ollama whisper piper-tts jarvis-agent

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
| Voice Transport | LiveKit (WebRTC, self-hosted) |
| Voice Agent | Python, LiveKit Agents SDK |
| LLM | Ollama (Llama 3.1 / Gemma 2 / Mistral) |
| Speech-to-Text | Whisper (local) or Deepgram (free tier) |
| Text-to-Speech | Piper (local) or Deepgram (free tier) |
| Infrastructure | Docker Compose |

## License

Private — not for distribution.
