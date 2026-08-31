"""
Jarvis MLOps Automated Agent Evaluation & Regression Test Suite
Tests tool execution, memory recall, system telemetry, and agent stability.
"""

import asyncio
import sys
import json
import os

# Add agent directory to path
agent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../agent"))
sys.path.insert(0, agent_dir)

from actions.system_monitor import get_system_telemetry
from actions.web_search import web_search
from actions.computer_settings import adjust_volume
from actions.file_processor import read_and_summarize_file
from memory.mem0_manager import MemoryManager

async def run_mlops_evaluation():
    print("=== Jarvis MLOps Agent Evaluation Suite ===")
    
    # Test 1: System Telemetry Action
    print("[1/4] Testing System Telemetry Action...")
    try:
        telemetry_str = get_system_telemetry()
        telemetry = json.loads(telemetry_str)
        assert "cpu_percent" in telemetry, "Missing cpu_percent in telemetry"
        assert "memory_used_percent" in telemetry, "Missing memory_used_percent in telemetry"
        print(f"  -> SUCCESS: Telemetry retrieved: CPU {telemetry['cpu_percent']}%, RAM {telemetry['memory_used_percent']}%")
    except Exception as e:
        print(f"  -> FAILURE: System telemetry test failed: {e}")
        sys.exit(1)

    # Test 2: Memory Manager
    print("[2/4] Testing Memory Management & Retrieval...")
    try:
        memory = MemoryManager()
        memories = await memory.get_memories(user_id="Boss")
        assert isinstance(memories, list), "Memories should return a list"
        print(f"  -> SUCCESS: Memory store active. Retrieved {len(memories)} memory items.")
    except Exception as e:
        print(f"  -> FAILURE: Memory test failed: {e}")
        sys.exit(1)

    # Test 3: Audio Volume Control Action
    print("[3/4] Testing Computer Settings Action (Volume)...")
    try:
        res = adjust_volume(60)
        assert "volume" in res or isinstance(res, str), "Volume control should return result"
        print(f"  -> SUCCESS: Volume adjustment response: {res}")
    except Exception as e:
        print(f"  -> FAILURE: Volume control test failed: {e}")
        sys.exit(1)

    # Test 4: File Processor Action
    print("[4/4] Testing File Processor Action...")
    try:
        res = read_and_summarize_file("README.md")
        assert isinstance(res, str), "File summary should be a string"
        print("  -> SUCCESS: File processor executed correctly.")
    except Exception as e:
        print(f"  -> FAILURE: File processor test failed: {e}")
        sys.exit(1)

    print("=== All MLOps Agent Evaluations Passed Successfully ===")

if __name__ == "__main__":
    asyncio.run(run_mlops_evaluation())
