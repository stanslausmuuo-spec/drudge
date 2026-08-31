"""
Jarvis Voice Agent — Production-Grade Mark-LI Enhanced Architecture
Powered by LiveKit Agents, OpenAI Realtime / Ollama / Cloud LLMs,
Mem0 Persistent Memory, Dynamic Plugins, and Advanced Action Suite.
"""

import os
import json
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
    RoomInputOptions,
    ChatContext,
)
from livekit.plugins import openai, silero, noise_cancellation
from openai import AsyncOpenAI

from core.plugin_loader import PluginLoader
from memory.mem0_manager import MemoryManager
from actions.system_monitor import get_system_telemetry
from actions.web_search import web_search
from actions.computer_settings import adjust_volume
from actions.file_processor import read_and_summarize_file

load_dotenv()

logger = logging.getLogger("jarvis-agent")
logger.setLevel(logging.INFO)

LIVEKIT_URL = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "devkey")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "secret")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
WHISPER_URL = os.getenv("WHISPER_URL", "http://localhost:9000")
PIPER_URL = os.getenv("PIPER_URL", "http://localhost:5000")

JARVIS_SYSTEM_PROMPT = """You are Jarvis, an advanced, highly intelligent, privacy-first personal AI assistant and vision companion (Mark-LI architecture).
You speak with calm confidence, precision, and a touch of dry wit — like Tony Stark's JARVIS.
You are concise and direct. You answer questions accurately, inspect visual video feeds when available, and offer proactive suggestions."""


class JarvisTools(llm.FunctionContext):
    def __init__(self, plugins=None):
        super().__init__()
        self.plugins = plugins or {}

    @llm.ai_function(description="Read the contents of a local file in the project workspace")
    async def read_project_file(
        self,
        file_path: llm.TypeInfo(description="Relative path to the file") = "",
    ):
        return read_and_summarize_file(file_path)

    @llm.ai_function(description="Get current system telemetry (CPU, RAM, Disk)")
    async def get_system_stats(self):
        return get_system_telemetry()

    @llm.ai_function(description="Search the web for news, research, or information")
    async def search_web(
        self,
        query: llm.TypeInfo(description="Query to search on the web") = "",
    ):
        return web_search(query)

    @llm.ai_function(description="Adjust system audio volume level (0 to 100)")
    async def set_volume(
        self,
        level: llm.TypeInfo(description="Volume level percentage") = 50,
    ):
        return adjust_volume(level)


def prewarm(proc: JobProcess):
    """Pre-load VAD model and discover plugins."""
    proc.userData["vad"] = silero.VAD.load()
    plugins_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "plugins")
    loader = PluginLoader(plugins_dir)
    loaded = loader.discover_and_load()
    proc.userData["plugins"] = loaded
    proc.userData["memory"] = MemoryManager()
    logger.info("Prewarmed Jarvis Agent. Loaded plugins: %s", list(loaded.keys()))


async def entrypoint(ctx: JobContext):
    """Main agent entrypoint — runs for each new session."""
    logger.info("Jarvis agent starting in room: %s", ctx.room.name)

    selected_model = "llama3.1"
    providers_config = []
    
    @ctx.room.on("participant_connected")
    def on_participant_connected(participant):
        nonlocal selected_model, providers_config
        attrs = participant.attributes
        if attrs:
            if "model" in attrs:
                selected_model = attrs["model"]
            if "providers" in attrs:
                try:
                    providers_config = json.loads(attrs["providers"])
                except:
                    pass

    for participant in ctx.room.participants.values():
        attrs = participant.attributes
        if attrs:
            if "model" in attrs:
                selected_model = attrs["model"]
            if "providers" in attrs:
                try:
                    providers_config = json.loads(attrs["providers"])
                except:
                    pass

    logger.info("Selected model: %s", selected_model)

    memory: MemoryManager = ctx.proc.userData.get("memory")
    memories_list = await memory.get_memories(user_id="Boss")
    initial_ctx = ChatContext()
    if memories_list:
        memory_str = json.dumps(memories_list)
        initial_ctx.add_message(
            role="assistant",
            content=f"Relevant user memory context: {memory_str}"
        )

    # Shutdown hook for Mem0 persistence
    async def shutdown_hook():
        logger.info("Saving session context to Mem0...")
        chat_items = session._agent.chat_ctx.items if hasattr(session, "_agent") and session._agent else []
        messages_formatted = []
        for item in chat_items:
            content_str = ''.join(item.content) if isinstance(item.content, list) else str(item.content)
            if item.role in ['user', 'assistant']:
                messages_formatted.append({
                    "role": item.role,
                    "content": content_str.strip()
                })
        if messages_formatted:
            await memory.add_memories(messages_formatted, user_id="Boss")
        logger.info("Session context successfully persisted.")

    ctx.add_shutdown_callback(shutdown_hook)

    api_key = None
    provider_type = "ollama"

    if selected_model.startswith("gpt-4o-realtime"):
        provider_type = "realtime"
    elif selected_model.startswith("gpt-"):
        provider_type = "openai"
    elif selected_model.startswith("claude-"):
        provider_type = "anthropic"
    elif selected_model.startswith("gemini-"):
        provider_type = "google"

    for p in providers_config:
        if p.get("provider") == provider_type or (provider_type == "openai" and p.get("provider") == "openai"):
            api_key = p.get("apiKey")

    # Fallback to env OPENAI_API_KEY if needed
    if not api_key and os.getenv("OPENAI_API_KEY"):
        api_key = os.getenv("OPENAI_API_KEY")

    plugins = ctx.proc.userData.get("plugins", {})
    fnc_ctx = JarvisTools(plugins=plugins)

    if provider_type == "realtime" and api_key:
        logger.info("Using OpenAI Realtime Model for ultra-low latency voice")
        llm_plugin = openai.realtime.RealtimeModel(voice="sage", api_key=api_key)
        session = AgentSession()
        agent = Agent(
            instructions=JARVIS_SYSTEM_PROMPT,
            llm=llm_plugin,
            tools=[fnc_ctx.read_project_file, fnc_ctx.get_system_stats, fnc_ctx.search_web, fnc_ctx.set_volume],
            chat_ctx=initial_ctx,
        )
    else:
        if provider_type == "openai" and api_key:
            logger.info("Using OpenAI cloud LLM")
            llm_plugin = openai.LLM(model=selected_model, api_key=api_key)
        elif provider_type == "google" and api_key:
            logger.info("Using Google Gemini model via API key")
            client = AsyncOpenAI(
                api_key="",
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                default_headers={"x-goog-api-key": api_key},
            )
            llm_plugin = openai.LLM(model=selected_model, client=client)
        else:
            logger.info("Using local Ollama LLM (%s)", selected_model)
            llm_plugin = openai.LLM.with_ollama(
                model=selected_model,
                base_url=f"{OLLAMA_BASE_URL}/v1",
            )

        stt_plugin = openai.STT(
            base_url=f"{WHISPER_URL}/v1",
            api_key="not-needed",
            model="whisper-1",
        )

        tts_plugin = openai.TTS(
            base_url=f"{PIPER_URL}/v1",
            api_key="not-needed",
            model="tts-1",
        )

        vad = ctx.proc.userData.get("vad")
        if vad is None:
            vad = silero.VAD.load()

        session = AgentSession(
            stt=stt_plugin,
            llm=llm_plugin,
            tts=tts_plugin,
            vad=vad,
        )

        agent = Agent(
            instructions=JARVIS_SYSTEM_PROMPT,
            fnc_ctx=fnc_ctx,
        )

    await session.start(
        room=ctx.room,
        agent=agent,
        room_input_options=RoomInputOptions(
            video_enabled=True,
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    await ctx.connect()

    await session.generate_reply(
        instructions="Greet the user briefly. Introduce yourself as Jarvis (Production-Grade Mark-LI) and mention you are ready for voice and video assistance."
    )

    logger.info("Jarvis agent session started successfully")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        )
    )
