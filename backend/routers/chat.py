from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from services.claude_service import _groq_chat, _google_translate

router = APIRouter(prefix="/chat", tags=["chat"])

CHAT_SYSTEM = (
    "You are MuAIlim, an expert AI tutor helping Uzbek students prepare for the DTM university entrance exam "
    "(covers Math, History, Uzbek Language, Physics, Chemistry, Biology, English). "
    "Answer clearly and concisely in English. "
    "Focus on exam topics, study tips, explanations of concepts, and motivational advice. "
    "Keep answers under 120 words. No markdown, no bullet points — plain flowing sentences only."
)


class ChatMessage(BaseModel):
    role: str   # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []


@router.post("")
async def chat(req: ChatRequest):
    # Build messages for Groq (last 6 turns max to stay within context)
    history_msgs = [
        {"role": m.role, "content": m.content}
        for m in req.history[-6:]
    ]
    history_msgs.append({"role": "user", "content": req.message})

    import httpx, os
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "system", "content": CHAT_SYSTEM}] + history_msgs,
        "max_tokens": 200,
        "temperature": 0.5,
    }
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(GROQ_URL, json=payload, headers=headers)
            r.raise_for_status()
            english_reply = r.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        english_reply = "I'm having trouble connecting right now. Please try again in a moment."

    # Translate English → Uzbek via Google Translate
    uzbek_reply = await _google_translate(english_reply, target="uz", source="en")

    return {"reply": uzbek_reply, "reply_en": english_reply}
