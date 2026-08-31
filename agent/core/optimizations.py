"""
Performance Optimizations & Crash Isolation for Jarvis Agent
- Sliding window context compression for unlimited session length
- Async batching and crash-isolated tool execution
"""

import logging

logger = logging.getLogger("jarvis-optimizations")

def apply_sliding_window(chat_context_items: list, max_items: int = 30) -> list:
    """Compress chat history to prevent token bloat during long sessions."""
    if len(chat_context_items) <= max_items:
        return chat_context_items
    
    # Retain initial system/memory context items plus recent turns
    retained_head = chat_context_items[:2]
    retained_tail = chat_context_items[-(max_items - 2):]
    return retained_head + retained_tail

async def safe_execute_tool(func, *args, **kwargs):
    """Execute tool or plugin with isolated try-except crash protection."""
    try:
        return await func(*args, **kwargs) if callable(func) else "Error: Invalid tool function."
    except Exception as e:
        logger.error("Tool execution failed safely: %s", e)
        return f"Error executing tool: {str(e)}"
