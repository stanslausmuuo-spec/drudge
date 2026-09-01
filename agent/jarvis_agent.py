"""
Jarvis Voice Agent — Production-Grade Enhanced Architecture
Powered by LiveKit Agents, Cloud LLMs (OpenAI / Gemini / Anthropic),
Mem0 Persistent Memory, Dynamic Plugins, and Advanced Action Suite.
"""

import os
import json
import asyncio
import logging
from inspect import iscoroutinefunction
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
try:
    from livekit import rtc as _rtc
    RTC_AVAILABLE = True
except ImportError:
    _rtc = None
    RTC_AVAILABLE = False

from core.plugin_loader import PluginLoader
from memory.mem0_manager import MemoryManager
from actions.system_monitor import get_system_telemetry
from actions.web_search import web_search
from actions.computer_settings import adjust_volume
from actions.file_processor import read_and_summarize_file
from actions.vision import analyze as vision_analyze

# Holds the most recent camera frame captured from the remote participant's video track.
_LATEST_FRAME_HOLDER: dict = {"frame": None}

load_dotenv()

logger = logging.getLogger("jarvis-agent")
logger.setLevel(logging.INFO)

LIVEKIT_URL = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "devkey")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "secret")
WHISPER_URL = os.getenv("WHISPER_URL", "http://localhost:9000")
PIPER_URL = os.getenv("PIPER_URL", "http://localhost:5000")

JARVIS_SYSTEM_PROMPT = """You are Jarvis, an advanced, highly intelligent, privacy-first personal AI assistant and vision companion.
You speak with calm confidence, precision, and a touch of dry wit — like Tony Stark's JARVIS.
You are concise and direct. You answer questions accurately, inspect visual video feeds when available, and offer proactive suggestions."""


class JarvisTools(llm.FunctionContext):
    def __init__(self, plugins=None, memory=None, room=None):
        super().__init__()
        self.plugins = plugins or {}
        self.memory = memory
        self.room = room
        self._plugin_tools = []
        self._register_plugins()

    async def _set_state(self, state: str):
        """Publish an agent_state data message so the frontend can reflect status."""
        if self.room and RTC_AVAILABLE and _rtc is not None:
            try:
                await self.room.local_participant.publish_data(
                    json.dumps({"type": "agent_state", "state": state}).encode("utf-8"),
                    reliable=True,
                )
            except Exception:  # noqa: BLE001
                pass

    def _register_plugins(self):
        """Dynamically expose each loaded plugin as an ai_function tool.

        Each plugin's `run` accepts keyword arguments. We expose one ai_function per
        plugin that accepts a JSON-object string of arguments and dispatches to run().
        """
        for name, plugin in self.plugins.items():
            fn = plugin.get("run")
            plugin_name = name

            @llm.ai_function(
                description=f"Execute the '{plugin_name}' plugin. Pass arguments as a JSON object string, e.g. {json.dumps({})}."
            )
            async def _plugin_card(
                self,
                params: llm.TypeInfo(description="JSON object string of arguments for the plugin") = "{}",
                _name: str = plugin_name,
                _fn=fn,
            ):
                try:
                    kwargs = json.loads(params) if isinstance(params, str) else (params or {})
                    if not isinstance(kwargs, dict):
                        kwargs = {}
                    if _fn and not iscoroutinefunction(_fn):
                        res = _fn(**kwargs)
                    elif _fn:
                        res = await _fn(**kwargs)
                    else:
                        return {"plugin": _name, "error": "no run function"}
                    return {"plugin": _name, "result": res}
                except Exception as e:  # noqa: BLE001
                    return {"plugin": _name, "error": str(e)}

            setattr(self, f"plugin_{plugin_name}", _plugin_card)
            self._plugin_tools.append(getattr(self, f"plugin_{plugin_name}"))

    def get_plugin_tools(self):
        return list(self._plugin_tools)

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

    @llm.ai_function(description="Recall long-term user memories, preferences, and context")
    async def recall_memories(self):
        if self.memory:
            mems = await self.memory.get_memories(user_id="Boss")
            return {"memories": mems}
        return {"memories": ["No active memory manager available."]}

    @llm.ai_function(description="Analyze the user's camera feed and describe what is visible")
    async def describe_visuals(
        self,
        prompt: llm.TypeInfo(description="What to look for in the camera frame, e.g. 'what objects are on the desk?'") = "Describe what you see in the camera feed.",
    ):
        await self._set_state("thinking")
        try:
            frame = _LATEST_FRAME_HOLDER.get("frame")
            if frame is None:
                return {"result": "No camera frame available. The user may not have their camera on."}
            return await vision_analyze(frame, prompt)
        finally:
            await self._set_state("idle")


def _start_vision_capture(room) -> None:
    """Subscribe to the remote participant's video track and buffer the latest frame."""
    if not RTC_AVAILABLE or _rtc is None:
        return

    tasks = []

    def _stream_from_track(track):
        stream = _rtc.VideoStream(track)
        async def _reader():
            try:
                async for event in stream:
                    _LATEST_FRAME_HOLDER["frame"] = event.frame
            except Exception as e:  # noqa: BLE001
                logger.debug("Vision frame reader stopped: %s", e)
        task = asyncio.create_task(_reader())
        tasks.append(task)
        task.add_done_callback(lambda t: tasks.remove(t) if t in tasks else None)

    def _on_new_track(track, *args, **kwargs):
        if track and track.kind == _rtc.TrackKind.KIND_VIDEO:
            _stream_from_track(track)

    for participant in room.remote_participants.values():
        for pub in participant.track_publications.values():
            trk = pub.track
            if trk and getattr(trk, "kind", None) == _rtc.TrackKind.KIND_VIDEO:
                _stream_from_track(trk)

    room.on("track_subscribed", _on_new_track)


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

    selected_model = "gemini-3-flash-preview"
    providers_config = []
    stt_provider = "whisper"
    tts_provider = "piper"
    
    @ctx.room.on("participant_connected")
    def on_participant_connected(participant):
        nonlocal selected_model, providers_config, stt_provider, tts_provider
        attrs = participant.attributes
        if attrs:
            if "model" in attrs:
                selected_model = attrs["model"]
            if "providers" in attrs:
                try:
                    providers_config = json.loads(attrs["providers"])
                except:
                    pass
            if "sttProvider" in attrs:
                stt_provider = attrs["sttProvider"]
            if "ttsProvider" in attrs:
                tts_provider = attrs["ttsProvider"]

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
            if "sttProvider" in attrs:
                stt_provider = attrs["sttProvider"]
            if "ttsProvider" in attrs:
                tts_provider = attrs["ttsProvider"]

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
    provider_type = "google"

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

    # Fallback to env Google API key for the default Gemini model
    if not api_key and provider_type == "google":
        if selected_model.startswith("gemini-"):
            api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

    # Fallback to env OPENAI_API_KEY if needed
    if not api_key and os.getenv("OPENAI_API_KEY"):
        api_key = os.getenv("OPENAI_API_KEY")

    plugins = ctx.proc.userData.get("plugins", {})
    fnc_ctx = JarvisTools(plugins=plugins, memory=memory, room=ctx.room)

    if provider_type == "realtime" and api_key:
        logger.info("Using OpenAI Realtime Model for ultra-low latency voice")
        llm_plugin = openai.realtime.RealtimeModel(voice="sage", api_key=api_key)
        session = AgentSession()
        agent = Agent(
            instructions=JARVIS_SYSTEM_PROMPT,
            llm=llm_plugin,
            tools=[
                fnc_ctx.read_project_file,
                fnc_ctx.get_system_stats,
                fnc_ctx.search_web,
                fnc_ctx.set_volume,
                fnc_ctx.recall_memories,
                fnc_ctx.describe_visuals,
                *fnc_ctx.get_plugin_tools(),
            ],
            chat_ctx=initial_ctx,
        )
    else:
        if provider_type == "openai" and api_key:
            logger.info("Using OpenAI cloud LLM")
            llm_plugin = openai.LLM(model=selected_model, api_key=api_key)
        elif provider_type == "anthropic" and api_key:
            logger.info("Using Anthropic Claude model via OpenAI-compatible endpoint")
            client = AsyncOpenAI(
                api_key=api_key,
                base_url="https://api.anthropic.com/v1/",
            )
            llm_plugin = openai.LLM(model=selected_model, client=client)
        elif provider_type == "google" and api_key:
            logger.info("Using Google Gemini model via API key")
            client = AsyncOpenAI(
                api_key="",
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                default_headers={"x-goog-api-key": api_key},
            )
            llm_plugin = openai.LLM(model=selected_model, client=client)
        else:
            logger.warning("No API key configured for %s. Falling back to Gemini default.", selected_model)
            fallback_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
            if not fallback_key:
                raise RuntimeError("No model provider configured. Set GOOGLE_API_KEY (or OPENAI_API_KEY/ANTHROPIC_API_KEY) and pass an apiKey via settings.")
            client = AsyncOpenAI(
                api_key="",
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                default_headers={"x-goog-api-key": fallback_key},
            )
            llm_plugin = openai.LLM(model="gemini-3-flash-preview", client=client)

        # --- STT/TTS plugin selection (Whisper/Piper local vs Deepgram cloud) ---
        deepgram_key = os.getenv("DEEPGRAM_API_KEY")

        if stt_provider == "deepgram" and deepgram_key:
            logger.info("Using Deepgram cloud STT")
            stt_plugin = openai.STT(
                base_url="https://api.deepgram.com/v1/openai",
                api_key=deepgram_key,
                model="whisper-1",
            )
        else:
            logger.info("Using local Whisper STT")
            stt_plugin = openai.STT(
                base_url=f"{WHISPER_URL}/v1",
                api_key="not-needed",
                model="whisper-1",
            )

        if tts_provider == "deepgram" and deepgram_key:
            logger.info("Using Deepgram cloud TTS")
            tts_plugin = openai.TTS(
                base_url="https://api.deepgram.com/v1/openai",
                api_key=deepgram_key,
                model="aura-asteria-en",
            )
        else:
            logger.info("Using local Piper TTS")
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

    # --- Vision: capture the latest camera frame from the remote participant ---
    if RTC_AVAILABLE:
        _start_vision_capture(ctx.room)

    await ctx.connect()

    await session.generate_reply(
        instructions="Greet the user briefly. Introduce yourself as Jarvis and mention you are ready for voice and video assistance."
    )

    logger.info("Jarvis agent session started successfully")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        )
    )
