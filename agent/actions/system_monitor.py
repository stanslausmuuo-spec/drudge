import json
import psutil

def get_system_telemetry() -> str:
    """Get continuous CPU, RAM, Disk telemetry."""
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
        return f"Error fetching system telemetry: {str(e)}"
