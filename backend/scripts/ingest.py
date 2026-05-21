import sys
import os
import json
import uuid
import httpx
import pdfplumber
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

DATA_DIR = Path(__file__).parent.parent / "data"
OUTPUT_FILE = DATA_DIR / "questions.json"
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

SUBJECT_KEYWORDS = {
    "math": ["matematik", "algebra", "geometri", "trigonometri", "logarifm", "integral", "tengla"],
    "history": ["tarix", "davlat", "sulola", "amir", "temur", "sovet", "mustaqil", "yil"],
    "uzbek": ["ona tili", "grammatika", "adabiyot", "gap", "fe'l", "ot", "sifat", "navoiy"],
}


def detect_subject(text: str) -> str:
    text_lower = text.lower()
    scores = {s: sum(1 for kw in kws if kw in text_lower) for s, kws in SUBJECT_KEYWORDS.items()}
    return max(scores, key=scores.get) if max(scores.values()) > 0 else "math"


def extract_text_from_pdf(pdf_path: Path) -> str:
    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
    return "\n".join(pages)


def chunk_text(text: str, chunk_size: int = 3000) -> list[str]:
    words = text.split()
    chunks, current = [], []
    for word in words:
        current.append(word)
        if len(" ".join(current)) >= chunk_size:
            chunks.append(" ".join(current))
            current = []
    if current:
        chunks.append(" ".join(current))
    return chunks


def extract_questions_with_ai(text_chunk: str, subject: str) -> list[dict]:
    subject_uz = {"math": "Matematika", "history": "Tarix", "uzbek": "Ona tili"}.get(subject, subject)
    prompt = f"""Quyidagi matndan {subject_uz} faniga oid test savollarini topib, JSON formatida qaytargin.
Agar matnda test savollari (A, B, C, D variantli) bo'lsa, ularni ajratib ol.
Agar savollar bo'lmasa, matn asosida 3 ta test savol tuzib ber.

Matn:
{text_chunk[:2000]}

Faqat JSON qaytargin, boshqa matn yo'q:
{{
  "questions": [
    {{
      "text": "Savol matni",
      "options": ["A variant", "B variant", "C variant", "D variant"],
      "correct_index": 0,
      "topic": "Mavzu nomi",
      "difficulty": "easy|medium|hard"
    }}
  ]
}}"""

    try:
        payload = {
            "model": OLLAMA_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
            "options": {"num_predict": 1500, "temperature": 0.3},
        }
        r = httpx.post(f"{OLLAMA_URL}/api/chat", json=payload, timeout=120.0)
        r.raise_for_status()
        raw = r.json()["message"]["content"].strip()
        start, end = raw.find("{"), raw.rfind("}") + 1
        if start == -1:
            return []
        data = json.loads(raw[start:end])
        return data.get("questions", [])
    except Exception as e:
        print(f"  AI xatolik: {e}")
        return []


def ingest_pdf(pdf_path: Path, existing_ids: set) -> list[dict]:
    print(f"\nIshlanmoqda: {pdf_path.name}")
    text = extract_text_from_pdf(pdf_path)
    if not text.strip():
        print("  Matn topilmadi (skanerlangan PDF bo'lishi mumkin)")
        return []

    subject = detect_subject(text)
    print(f"  Fan aniqlandi: {subject}")

    chunks = chunk_text(text, chunk_size=2500)
    max_chunks = 8
    print(f"  {len(chunks)} ta bo'lak topildi (max {max_chunks} ta ishlanadi)")

    all_questions = []
    for i, chunk in enumerate(chunks[:max_chunks]):
        print(f"  Bo'lak {i+1}/{min(len(chunks),10)} AI orqali ishlanmoqda...")
        qs = extract_questions_with_ai(chunk, subject)
        for q in qs:
            q_id = f"pdf_{uuid.uuid4().hex[:10]}"
            if q_id not in existing_ids:
                existing_ids.add(q_id)
                all_questions.append({
                    "id": q_id,
                    "subject": subject,
                    "topic": q.get("topic", "Umumiy"),
                    "difficulty": q.get("difficulty", "medium"),
                    "text": q.get("text", ""),
                    "options": q.get("options", []),
                    "correct_index": q.get("correct_index", 0),
                    "source": f"pdf:{pdf_path.name}",
                    "year": None,
                })
        print(f"     {len(qs)} ta savol topildi")

    return all_questions


def main():
    print("MuAIlim PDF Ingestion")
    print("=" * 40)

    # Load existing questions
    existing = []
    existing_ids = set()
    if OUTPUT_FILE.exists():
        existing = json.loads(OUTPUT_FILE.read_text(encoding="utf-8"))
        existing_ids = {q["id"] for q in existing}
        print(f"Mavjud savollar: {len(existing)} ta")

    # Find PDF files
    pdf_files = list(DATA_DIR.glob("*.pdf")) + list(DATA_DIR.glob("*.PDF"))
    if not pdf_files:
        print(f"\nPDF topilmadi!")
        print(f"PDF fayllarni quyidagi papkaga joylashtiring: {DATA_DIR}")
        return

    print(f"{len(pdf_files)} ta PDF topildi")

    # Process each PDF
    new_questions = []
    for pdf_path in pdf_files:
        qs = ingest_pdf(pdf_path, existing_ids)
        new_questions.extend(qs)

    # Save combined
    all_questions = existing + new_questions
    OUTPUT_FILE.write_text(json.dumps(all_questions, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n{'='*40}")
    print(f"Tayyor! {len(new_questions)} ta yangi savol qo'shildi")
    print(f"Jami: {len(all_questions)} ta savol")
    print(f"Saqlandi: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
