"""
Jarvis Plugin: Time & Date Utilities
Provides current time/date and timezone conversions via the Jarvis plugin system.
This file intentionally does NOT start with '_' so PluginLoader discovers it.
"""

from datetime import datetime, timezone as _tz
from zoneinfo import ZoneInfo

PLUGIN = {
    "name": "time_plugin",
    "version": "1.0.0",
    "description": "Current time, date, and timezone conversions",
    "author": "Jarvis",
    "enabled": True,
}

SCHEMA = {
    "type": "function",
    "function": {
        "name": "time_plugin",
        "description": "Get the current time, date, and timezone information.",
        "parameters": {
            "type": "object",
            "properties": {
                "timezone": {
                    "type": "string",
                    "description": "Optional IANA timezone name (e.g. 'America/New_York'). Defaults to UTC.",
                }
            },
            "required": [],
        },
    },
}


def run(timezone: str = "UTC") -> dict:
    """Return a dict of formatted current time/date info for the given timezone."""
    try:
        tz = ZoneInfo(timezone) if timezone else _tz.utc
    except Exception:
        tz = _tz.utc

    try:
        now = datetime.now(tz)
    except Exception:
        now = datetime.now(_tz.utc)
    return {
        "timezone": str(tz),
        "iso": now.isoformat(),
        "date": now.strftime("%A, %B %d, %Y"),
        "time": now.strftime("%I:%M:%S %p"),
        "utc_offset": now.strftime("%z"),
    }
