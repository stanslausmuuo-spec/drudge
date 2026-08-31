import os
import json
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
        
        # Fallback to local
        prefs = self.data.get("preferences", {})
        return [f"{k}: {v}" for k, v in prefs.items()]

    async def add_memories(self, messages: list, user_id: str = "Boss"):
        """Add conversation turns to Mem0 and local store asynchronously."""
        if self.mem0_client:
            try:
                await self.mem0_client.add(messages, user_id=user_id)
                logger.info("Successfully committed conversation turns to Mem0.")
            except Exception as e:
                logger.warning("Mem0 add error: %s", e)
        
        # Also log session locally
        sessions = self.data.get("sessions", [])
        sessions.append({"timestamp": os.getenv("TIMESTAMP"), "messages": messages[-4:]})
        self.data["sessions"] = sessions[-20:] # Keep last 20
        self.save_local()
