"""
Jarvis Data Science Telemetry & Performance Analytics
Analyzes agent session telemetry, latency percentiles, tool usage distribution, and token efficiency.
"""

import json
import statistics

def analyze_telemetry():
    print("=== Jarvis Data Science Telemetry & Analytics ===")
    
    # Simulated production session telemetry dataset
    sessions = [
        {"session_id": "sess_001", "turns": 12, "avg_latency_ms": 420.5, "tools_invoked": ["get_system_stats", "search_web"], "token_efficiency": 0.89},
        {"session_id": "sess_002", "turns": 8, "avg_latency_ms": 380.2, "tools_invoked": ["read_project_file"], "token_efficiency": 0.94},
        {"session_id": "sess_003", "turns": 25, "avg_latency_ms": 490.1, "tools_invoked": ["search_web", "search_web", "set_volume"], "token_efficiency": 0.82},
        {"session_id": "sess_004", "turns": 15, "avg_latency_ms": 395.0, "tools_invoked": ["get_system_stats"], "token_efficiency": 0.91},
        {"session_id": "sess_005", "turns": 18, "avg_latency_ms": 410.8, "tools_invoked": ["read_project_file", "recall_memories"], "token_efficiency": 0.88}
    ]

    total_sessions = len(sessions)
    total_turns = sum(s["turns"] for s in sessions)
    latencies = [s["avg_latency_ms"] for s in sessions]
    efficiencies = [s["token_efficiency"] for s in sessions]

    mean_latency = statistics.mean(latencies)
    p95_latency = statistics.quantiles(latencies, n=20)[18] if total_sessions > 1 else latencies[0]
    mean_efficiency = statistics.mean(efficiencies) * 100

    tool_counts = {}
    for s in sessions:
        for tool in s["tools_invoked"]:
            tool_counts[tool] = tool_counts.get(tool, 0) + 1

    print(f"Total Analyzed Sessions: {total_sessions}")
    print(f"Total Conversation Turns: {total_turns}")
    print(f"Mean Response Latency: {mean_latency:.2f} ms")
    print(f"P95 Response Latency: {p95_latency:.2f} ms")
    print(f"Mean Token Efficiency Score: {mean_efficiency:.1f}%")
    print("\nTool Invocation Distribution:")
    for tool, count in tool_counts.items():
        print(f"  - {tool}: {count} calls ({(count / sum(tool_counts.values())) * 100:.1f}%)")

    print("=== Data Science Telemetry Analysis Complete ===")

if __name__ == "__main__":
    analyze_telemetry()
