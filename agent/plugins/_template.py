"""
Plugin Template for Jarvis (Mark-LI architecture)
Drop any .py file implementing this structure into the plugins/ directory.
"""

PLUGIN = {
    "name": "sample_plugin",
    "version": "1.0.0",
    "description": "Template plugin description",
    "author": "FatihMakes / Jarvis",
    "enabled": True,
}

# Define OpenAI/LiveKit function schema
SCHEMA = {
    "type": "function",
    "function": {
        "name": "sample_plugin_action",
        "description": "Description of what this plugin tool does",
        "parameters": {
            "type": "object",
            "properties": {
                "param1": {
                    "type": "string",
                    "description": "Parameter description",
                }
            },
            "required": ["param1"],
        },
    },
}

def run(param1: str) -> str:
    """Execute plugin action logic."""
    try:
        return f"Plugin executed successfully with param: {param1}"
    except Exception as e:
        return f"Plugin execution error: {str(e)}"
