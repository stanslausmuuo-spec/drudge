import os
import json
import logging

logger = logging.getLogger("jarvis-memory")

class MemoryManager:
    def __init__(self, memory_file: str = None):
        if not memory_file:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            memory_file = os.path.join(base_dir, "long_term.json")
        self.memory_file = memory_file
        self.data = self._load()

    def _load(self):
        if os.path.exists(self.memory_file):
            try:
                with open(self.memory_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error("Error loading long-term memory: %s", e)
        return {
            "identity": {"assistant_name": "Jarvis", "user_name": "Boss"},
            "preferences": {},
            "projects": [],
            "sessions": []
        }

    def save(self):
        try:
            with open(self.memory_file, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2)
        except Exception as e:
            logger.error("Error saving long-term memory: %s", e)

    def get(self, key, default=None):
        return self.data.get(key, default)

    def set(self, key, value):
        self.data[key] = value
        self.save()
