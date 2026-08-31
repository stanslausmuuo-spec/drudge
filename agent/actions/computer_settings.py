import os
import platform

def adjust_volume(level: int) -> str:
    """Adjust system audio volume (0-100)."""
    try:
        sys_name = platform.system()
        if sys_name == "Darwin":
            os.system(f"osascript -e 'set volume output volume {level}'")
        elif sys_name == "Linux":
            os.system(f"amixer set Master {level}%")
        elif sys_name == "Windows":
            # Windows volume adjustment placeholder or nircmd
            pass
        return f"Volume adjusted to {level}%."
    except Exception as e:
        return f"Error adjusting volume: {str(e)}"
