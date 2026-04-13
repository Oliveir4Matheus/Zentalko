"""
learnEnglish — edge-tts microservice.

Exposes POST /synthesize { text, voice? } -> audio/mpeg bytes.
Deterministic voice default (en-US-AriaNeural); caller can override.
"""
from __future__ import annotations

import hashlib
import io
import logging
from typing import Optional

import edge_tts
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

logger = logging.getLogger("tts")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="learnEnglish TTS", version="0.1.0")

DEFAULT_VOICE = "en-US-AriaNeural"


class SynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4000)
    voice: Optional[str] = None
    rate: Optional[str] = None  # e.g. "-10%" or "+0%"


@app.get("/health")
async def health() -> dict:
    return {"ok": True}


@app.post("/synthesize")
async def synthesize(req: SynthesizeRequest) -> Response:
    voice = req.voice or DEFAULT_VOICE
    rate = req.rate or "+0%"
    try:
        buf = io.BytesIO()
        communicate = edge_tts.Communicate(req.text, voice=voice, rate=rate)
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                buf.write(chunk["data"])
        data = buf.getvalue()
        if not data:
            raise HTTPException(status_code=502, detail="empty audio from edge-tts")
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.exception("edge-tts failure")
        raise HTTPException(status_code=502, detail=f"edge-tts: {exc}") from exc

    etag = hashlib.sha1(req.text.encode("utf-8") + voice.encode("utf-8")).hexdigest()
    return Response(
        content=data,
        media_type="audio/mpeg",
        headers={"ETag": etag, "Cache-Control": "public, max-age=86400"},
    )
