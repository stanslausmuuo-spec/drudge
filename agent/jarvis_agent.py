"""
Jarvis Voice Agent — LiveKit Agents Framework
A privacy-first AI assistant voice agent powered by Ollama LLM,
with local STT (Whisper) and TTS (Piper) via OpenAI-compatible APIs.
"""

import os
import logging
from dotenv import load_dotenv

from livekit.agents import (
    Agent,
    AgentSession,
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    llm,
    voice,
)
from livekit.plugins import openai, silero

load_dotenv()

logger = logging.getLogger("jarvis-agent")
logger.setLevel(logging.INFO)

LIVEKIT_URL = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "devkey")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "secret")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
WHISPER_URL = os.getenv("WHISPER_URL", "http://localhost:9000")
PIPER_URL = os.getenv("PIPER_URL", "http://localhost:5000")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")

JARVIS_SYSTEM_PROMPT = """You are Jarvis, an advanced, highly intelligent, privacy-first personal AI assistant.
You speak with calm confidence, precision, and a touch of dry wit — like Tony Stark's JARVIS.
You are concise and direct. You answer questions accurately and offer proactive suggestions when appropriate.
You never fabricate information. If you don't know something, you say so clearly.
You can help with: general knowledge, coding, math, creative writing, planning, and conversations.
All processing is local and private — you never send user data to external services."""


def prewarm(proc: JobProcess):
    """Pre-load VAD model for faster first response."""
    proc.userData["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    """Main agent entrypoint — runs for each new session."""
    logger.info("Jarvis agent starting in room: %s", ctx.room.name)

    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # --- LLM: Ollama (local) ---
    llm_plugin = openai.LLM.with_ollama(
        model=OLLAMA_MODEL,
        base_url=f"{OLLAMA_BASE_URL}/v1",
    )

    # --- STT: Whisper (local) via OpenAI-compatible endpoint ---
    stt_plugin = openai.STT(
        base_url=f"{WHISPER_URL}/v1",
        api_key="not-needed",
        model="whisper-1",
    )

    # --- TTS: Piper (local) via OpenAI-compatible endpoint ---
    tts_plugin = openai.TTS(
        base_url=f"{PIPER_URL}/v1",
        api_key="not-needed",
        model="tts-1",
    )

    # --- VAD ---
    vad = ctx.proc.userData.get("vad")
    if vad is None:
        vad = silero.VAD.load()

    # --- Agent Session ---
    session = AgentSession(
        stt=stt_plugin,
        llm=llm_plugin,
        tts=tts_plugin,
        vad=vad,
    )

    agent = Agent(
        instructions=JARVIS_SYSTEM_PROMPT,
    )

    await session.start(agent=agent, room=ctx.room)

    await session.generate_reply(
        instructions="Greet the user briefly. Introduce yourself as Jarvis and ask how you can help."
    )

    logger.info("Jarvis agent session started successfully")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        )
    )
