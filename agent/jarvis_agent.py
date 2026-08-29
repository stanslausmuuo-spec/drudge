"""
Jarvis Voice Agent — LiveKit Agents Framework
A privacy-first AI assistant voice agent powered by Ollama LLM (or Cloud LLM via user API key),
with local STT (Whisper) and TTS (Piper) via OpenAI-compatible APIs, plus powerful local tools and video/vision capabilities.
"""

import os
import json
import logging
import psutil
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

JARVIS_SYSTEM_PROMPT = """You are Jarvis, an advanced, highly intelligent, privacy-first personal AI assistant and vision companion.
You speak with calm confidence, precision, and a touch of dry wit — like Tony Stark's JARVIS.
You are concise and direct. You answer questions accurately, inspect visual video feeds when available, and offer proactive suggestions.
You have access to tools to inspect local project files, search code, and check system performance."""


# --- Agent Tools ---

class JarvisTools(llm.FunctionContext):
    @llm.ai_function(description="Read the contents of a local file in the project workspace")
    async def read_project_file(
        self,
        file_path: llm.TypeInfo(description="Relative path to the file (e.g. README.md, src/app/page.tsx)") = "",
    ):
        try:
            clean_path = os.path.normpath(file_path).lstrip("/")
            if ".." in clean_path:
                return "Error: Invalid file path."
            
            base_dir = os.path.dirname(os.path.abspath(__file__))
            root_dir = os.path.abspath(os.path.join(base_dir, ".."))
            full_path = os.path.join(root_dir, clean_path)

            if not os.path.exists(full_path) or not os.path.isfile(full_path):
                return f"Error: File '{file_path}' not found."

            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read(5000)
            return f"Contents of {file_path}:\n{content}"
        except Exception as e:
            return f"Error reading file: {str(e)}"

    @llm.ai_function(description="Get current system performance stats (CPU, RAM, Disk)")
    async def get_system_stats(self):
        try:
            cpu = psutil.cpu_percent(interval=0.5)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            return json.dumps({
                "cpu_percent": cpu,
                "memory_total_gb": round(memory.total / (1024**3), 2),
                "memory_used_percent": memory.percent,
                "disk_used_percent": disk.percent
            })
        except Exception as e:
            return f"Error fetching system stats: {str(e)}"

    @llm.ai_function(description="Search the codebase for a specific keyword or pattern")
    async def search_codebase(
        self,
        query: llm.TypeInfo(description="Keyword or pattern to search for") = "",
    ):
        try:
            if not query:
                return "Error: Query required."
            
            base_dir = os.path.dirname(os.path.abspath(__file__))
            root_dir = os.path.abspath(os.path.join(base_dir, ".."))
            
            matches = []
            for root, dirs, files in os.walk(root_dir):
                if any(p in root for p in ["node_modules", ".next", ".git", "__pycache__"]):
                    continue
                for file in files:
                    if file.endswith((".ts", ".tsx", ".js", ".py", ".md", ".json")):
                        f_path = os.path.join(root, file)
                        try:
                            with open(f_path, "r", encoding="utf-8", errors="ignore") as f:
                                for line_no, line in enumerate(f, 1):
                                    if query.lower() in line.lower():
                                        rel = os.path.relpath(f_path, root_dir)
                                        matches.append(f"{rel}:{line_no}: {line.strip()}")
                                        if len(matches) >= 15:
                                            break
                        except:
                            pass
                if len(matches) >= 15:
                    break
            
            if not matches:
                return f"No matches found for '{query}'."
            return "Search Results:\n" + "\n".join(matches)
        except Exception as e:
            return f"Error searching codebase: {str(e)}"


def prewarm(proc: JobProcess):
    """Pre-load VAD model for faster first response."""
    proc.userData["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    """Main agent entrypoint — runs for each new session."""
    logger.info("Jarvis agent starting in room: %s", ctx.room.name)

    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_AND_VIDEO)

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

    api_key = None
    provider_type = "ollama"

    if selected_model.startswith("gpt-"):
        provider_type = "openai"
    elif selected_model.startswith("claude-"):
        provider_type = "anthropic"
    elif selected_model.startswith("gemini-"):
        provider_type = "google"

    for p in providers_config:
        if p.get("provider") == provider_type:
            api_key = p.get("apiKey")

    if provider_type == "openai" and api_key:
        logger.info("Using OpenAI cloud LLM with user API key")
        llm_plugin = openai.LLM(model=selected_model, api_key=api_key)
    elif provider_type == "anthropic" and api_key:
        logger.info("Using Anthropic model via API key")
        llm_plugin = openai.LLM(model=selected_model, api_key=api_key, base_url="https://api.anthropic.com/v1")
    elif provider_type == "google" and api_key:
        logger.info("Using Google Gemini model via API key")
        llm_plugin = openai.LLM(model=selected_model, api_key=api_key, base_url="https://generativelanguage.googleapis.com/v1beta/openai/")
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
        fnc_ctx=JarvisTools(),
    )

    await session.start(agent=agent, room=ctx.room)

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
