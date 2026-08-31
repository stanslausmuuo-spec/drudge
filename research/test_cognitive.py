"""
Test suite for Jarvis Cognitive Architecture research primitives.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from cognitive_architecture import CognitiveArchitecture

def test_cognitive():
    cog = CognitiveArchitecture()
    
    # Test reflection
    resp = cog.reflect_on_response("Status report", "All systems operational, Boss.")
    assert "All systems" in resp
    
    # Test memory distillation
    distilled = cog.distill_memory([{"role": "user", "content": "Please be fast with this bug fix"}])
    assert distilled["urgency"] == "high"
    assert distilled["user_preferences"].get("speed_priority") is True
    
    print("SUCCESS: Cognitive architecture research primitives verified.")

if __name__ == "__main__":
    test_cognitive()
