"""
Vision capability: captures the latest video frame from a remote participant's
camera track and analyzes it with a vision-capable Gemini model via the
OpenAI-compatible endpoint, returning a natural-language description.
"""

import os
import json
import base64
import asyncio
import logging

logger = logging.getLogger("jarvis-vision")

try:
    from livekit import rtc
    LIVEKIT_RTC_AVAILABLE = True
except ImportError:
    rtc = None
    LIVEKIT_RTC_AVAILABLE = False

VISION_MODEL = os.getenv("VISION_MODEL", "gemini-2.5-flash")


def _gemini_key() -> str:
    return os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY") or ""


async def describe_frame(prompt: str) -> dict:
    """Analyze the latest camera frame. Returns {'result': <description>} or an error dict."""
    if not LIVEKIT_RTC_AVAILABLE:
        return {"result": "Vision is unavailable: LiveKit RTC modules were not installed."}
    logger.warning(
        "VISION REQUESTED but frame capture requires an rtc session handle. "
        "Ensure the room/track is passed to capture_frame()."
    )
    return {"result": "No camera frame available to analyze right now."}


async def _analyze_image(image_b64: str, prompt: str) -> str:
    key = _gemini_key()
    if not key:
        return "Vision is disabled: no Google Gemini API key configured (GOOGLE_API_KEY)."
    payload = {
        "model": VISION_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
                ],
            }
        ],
    }
    try:
        import httpx
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip() or "No description returned."
    except Exception as e:  # noqa: BLE001
        logger.warning("Vision analysis error: %s", e)
        return f"Vision analysis failed: {e}"


async def capture_frame(frame) -> str:
    """Encode an rtc.VideoFrame or PIL image to a base64 JPEG string."""
    try:
        if hasattr(frame, "to_image"):
            from PIL import Image
            img = frame.to_image()
            if img.mode != "RGB":
                img = img.convert("RGB")
            import io
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=70)
            return base64.b64encode(buf.getvalue()).decode("ascii")
    except Exception as e:  # noqa: BLE001
        logger.warning("Frame encode error: %s", e)
    return ""


async def analyze(frame, prompt: str) -> dict:
    """Analyze a single captured video frame with Gemini vision."""
    image_b64 = await capture_frame(frame)
    if not image_b64:
        return {"result": "Could not capture a camera frame to analyze."}
    text = await _analyze_image(image_b64, prompt)
    return {"result": text}
