import os
import json
import time
import logging

logger = logging.getLogger("jarvis-memory")

try:
    from mem0 import AsyncMemoryClient
    MEM0_AVAILABLE = True
except ImportError:
    MEM0_AVAILABLE = False

class MemoryManager:
    def __init__(self, memory_file: str = None):
        if not memory_file:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            memory_file = os.path.join(base_dir, "long_term.json")
        self.memory_file = memory_file
        self.data = self._load_local()
        # Ensure the local store file exists on disk so recall/persist actually work
        self.save_local()

        self.mem0_client = None
        if MEM0_AVAILABLE and os.getenv("MEM0_API_KEY"):
            try:
                self.mem0_client = AsyncMemoryClient(api_key=os.getenv("MEM0_API_KEY"))
                logger.info("Mem0 AsyncMemoryClient initialized successfully.")
            except Exception as e:
                logger.warning("Failed to initialize Mem0 client: %s. Using local memory fallback.", e)

    def _load_local(self):
        if os.path.exists(self.memory_file):
            try:
                with open(self.memory_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error("Error loading local memory: %s", e)
        return {
            "identity": {"assistant_name": "Jarvis", "user_name": "Boss"},
            "preferences": {},
            "projects": [],
            "sessions": []
        }

    def save_local(self):
        try:
            dirname = os.path.dirname(self.memory_file)
            if dirname:
                os.makedirs(dirname, exist_ok=True)
            with open(self.memory_file, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2)
        except Exception as e:
            logger.error("Error saving local memory: %s", e)

    async def get_memories(self, user_id: str = "Boss"):
        """Fetch memories from Mem0 with local JSON fallback."""
        if self.mem0_client:
            try:
                results = await self.mem0_client.get_all(user_id=user_id)
                if results:
                    return [r.get("memory") for r in results if "memory" in r]
            except Exception as e:
                logger.warning("Mem0 get_all error: %s. Falling back to local preferences.", e)

        # Fallback to local: return preferences AND recent sessions so recall is meaningful
        prefs = self.data.get("preferences", {})
        lines = [f"{k}: {v}" for k, v in prefs.items()]
        sessions = self.data.get("sessions", [])
        for sess in sessions[-3:]:
            for msg in sess.get("messages", []):
                if msg and msg.get("role") == "user" and msg.get("content"):
                    lines.append(msg["content"].strip()[:160])
        return lines

    async def add_memories(self, messages: list, user_id: str = "Boss"):
        """Add conversation turns to Mem0 and local store asynchronously."""
        if self.mem0_client:
            try:
                await self.mem0_client.add(messages, user_id=user_id)
                logger.info("Successfully committed conversation turns to Mem0.")
            except Exception as e:
                logger.warning("Mem0 add error: %s", e)

        # Persist preferences from assistant/user turns so recall returns real data
        for msg in messages:
            content = (msg.get("content") or "").strip()
            if not content or len(content) > 400:
                continue
            if msg.get("role") == "user" and ":" in content:
                key, _, val = content.partition(":")
                key = key.strip().lower()
                val = val.strip()
                if key and val and len(key) < 40:
                    self.data.setdefault("preferences", {})[key] = val
                elif not self.data.get("preferences", {}).get("last_topic"):
                    self.data.setdefault("preferences", {})["last_topic"] = content

        # Also log session locally with a real timestamp
        sessions = self.data.get("sessions", [])
        sessions.append({"timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"), "messages": messages[-4:]})
        self.data["sessions"] = sessions[-20:]  # Keep last 20
        self.save_local()
