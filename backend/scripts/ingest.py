"""
MuAIlim PDF Ingestion Script
-----------------------------
Supports paired savollar/javoblar PDFs:
  - "Mavzu savollar.pdf"  — questions with A/B/C/D options
  - "Mavzu javoblar.pdf"  — answer key (e.g. "1. C  2. A  3. B")

Also supports standalone PDFs with embedded correct answers.

Usage:
    cd backend
    venv\\Scripts\\python scripts\\ingest.py
"""

import re
import json
import sys
import uuid
import pdfplumber
from difflib import SequenceMatcher
from pathlib import Path

# Fix Windows terminal encoding for emoji/Uzbek output
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf_8"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

DATA_DIR   = Path(__file__).parent.parent / "data"
OUTPUT     = DATA_DIR / "questions.json"

SUBJECT_KEYWORDS = {
    "history": ["tarix","xonlik","sulola","temur","sovet","mustaqil","davlat","bobur","shayboni","movarounnahr","dashti","buxoro","xorazm"],
    "math":    ["matematik","algebra","geometri","trigonometri","logarifm","integral","tengla","funksiya",
                "tengsizlik","modulli","chiziqli","kvadrat","formulalar","ko'paytirish","sistema"],
    "uzbek":   ["ona tili","grammatika","adabiyot","gap","fe'l","ot ","sifat","navoiy","imlo"],
}

ANSWER_LETTER = {"A": 0, "B": 1, "C": 2, "D": 3}


def detect_subject(text: str) -> str:
    t = text.lower()
    scores = {s: sum(1 for kw in kws if kw in t) for s, kws in SUBJECT_KEYWORDS.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "history"


def detect_topic(filename: str) -> str:
    name = filename.replace("savollar", "").replace("javoblar", "").replace(".pdf", "").strip()
    return name if name else "Umumiy"


def extract_text(pdf_path: Path) -> str:
    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                pages.append(t)
    return "\n".join(pages)


def parse_answer_key(text: str) -> dict[int, int]:
    """
    Parse answer keys in multiple formats:
      Format 1: '1. C  2. A  3. B'  (inline)
      Format 2: '1 B\\n2 A\\n3 C'   (table, one per line)
      Format 3: '1) C  2) A'        (with parenthesis)
    """
    answers = {}
    # Format 1 & 3: number followed immediately by letter on same token
    for m in re.finditer(r'(\d+)\s*[.\)]\s*([ABCD])\b', text):
        answers[int(m.group(1))] = ANSWER_LETTER[m.group(2)]
    # Format 2: number and letter on same line separated by whitespace only
    if not answers:
        for m in re.finditer(r'^\s*(\d+)\s+([ABCD])\s*$', text, re.MULTILINE):
            answers[int(m.group(1))] = ANSWER_LETTER[m.group(2)]
    # Fallback: any digit–letter pair on same line
    if not answers:
        for m in re.finditer(r'(\d+)\s+([ABCD])(?:\s|$)', text):
            answers[int(m.group(1))] = ANSWER_LETTER[m.group(2)]
    return answers


def parse_questions(text: str, topic: str, subject: str, answer_key: dict[int, int]) -> list[dict]:
    """
    Parse questions of the form:
      1. Question text
      A) Option1  B) Option2
      C) Option3  D) Option4
    """
    # Normalise spacing around option letters
    text = re.sub(r'\s+([ABCD])[)\.]', r'\n\1)', text)
    text = re.sub(r'\n{3,}', '\n\n', text)

    questions = []
    # Split on question numbers: "1." "2." etc at start of line or after newline
    blocks = re.split(r'(?:^|\n)(\d+)[.\)]\s*', text, flags=re.MULTILINE)

    i = 1
    while i + 1 < len(blocks):
        q_num_str = blocks[i].strip()
        q_body    = blocks[i + 1].strip()
        i += 2

        try:
            q_num = int(q_num_str)
        except ValueError:
            continue

        # Extract options A) B) C) D)
        opt_pattern = re.compile(
            r'A[)\.]\s*(.*?)\s*B[)\.]\s*(.*?)\s*C[)\.]\s*(.*?)\s*D[)\.]\s*(.*?)(?:\n|$)',
            re.DOTALL
        )
        m = opt_pattern.search(q_body)
        if not m:
            continue

        # Question text is everything before the first option
        q_text = q_body[:m.start()].strip()
        q_text = re.sub(r'\s+', ' ', q_text)
        if len(q_text) < 5:
            continue

        options = [
            re.sub(r'\s+', ' ', m.group(g).strip())
            for g in [1, 2, 3, 4]
        ]

        # Skip if any option is empty
        if any(len(o) < 1 for o in options):
            continue

        correct = answer_key.get(q_num)
        if correct is None:
            continue  # skip questions without an answer key entry

        questions.append({
            "id":            f"pdf_{uuid.uuid4().hex[:10]}",
            "subject":       subject,
            "topic":         topic,
            "difficulty":    "medium",
            "text":          q_text,
            "options":       options,
            "correct_index": correct,
            "source":        "pdf_import",
            "year":          None,
        })

    return questions


def process_pair(savollar_path: Path, javoblar_path: Path, existing_questions: list) -> list[dict]:
    print(f"\n📄 {savollar_path.name}")

    q_text = extract_text(savollar_path)
    a_text = extract_text(javoblar_path)

    subject = detect_subject(q_text)
    topic   = detect_topic(savollar_path.stem)

    print(f"   📚 Fan: {subject}  |  Mavzu: {topic}")

    answer_key = parse_answer_key(a_text)
    print(f"   🔑 Javoblar topildi: {len(answer_key)} ta")

    questions = parse_questions(q_text, topic, subject, answer_key)
    print(f"   ✅ Savollar: {len(questions)} ta")

    return questions


def process_standalone(pdf_path: Path) -> list[dict]:
    """Process a standalone PDF that has questions but no separate answer key."""
    print(f"\n📄 {pdf_path.name} (standalone)")
    text    = extract_text(pdf_path)
    subject = detect_subject(text)
    topic   = detect_topic(pdf_path.stem)
    answer_key = parse_answer_key(text)

    if answer_key:
        qs = parse_questions(text, topic, subject, answer_key)
        print(f"   ✅ {len(qs)} ta savol topildi (embedded answers)")
        return qs

    print("   ⚠️  Javoblar topilmadi — bu PDF o'tkazib yuborildi")
    return []


def main():
    print("🚀 MuAIlim PDF Ingestion (Regex Parser)")
    print("=" * 48)

    existing = []
    if OUTPUT.exists():
        try:
            existing = json.loads(OUTPUT.read_text(encoding="utf-8"))
            print(f"📊 Mavjud savollar: {len(existing)} ta")
        except Exception:
            existing = []

    existing_texts = {q["text"][:60] for q in existing}

    # ── Find paired savollar / javoblar files ──
    all_pdfs  = set(DATA_DIR.glob("*.pdf")) | set(DATA_DIR.glob("*.PDF"))
    savollar  = {p for p in all_pdfs if "savol" in p.name.lower()}
    javoblar  = {p for p in all_pdfs if "javob" in p.name.lower()}
    paired    = set()
    new_questions = []

    def normalise(name: str) -> str:
        """Strip subject/answer keywords and normalise Unicode for matching."""
        n = name.lower().replace("_", " ")
        for kw in ["savollar", "savol", "javoblar", "javob", ".pdf"]:
            n = n.replace(kw, "")
        # Normalise Uzbek special chars
        n = n.replace("o'", "o").replace("o`", "o").replace("g'", "g").replace("'", "").replace("`", "")
        return n.strip()

    def best_javob_match(s_base: str, javoblar_set) -> "Path | None":
        """Exact match first; fall back to fuzzy match (ratio >= 0.85)."""
        for j in javoblar_set:
            if normalise(j.name) == s_base:
                return j
        # Fuzzy fallback for typos (e.g. 'tenglamalar' vs 'tenglamar')
        best, best_j = 0.0, None
        for j in javoblar_set:
            ratio = SequenceMatcher(None, s_base, normalise(j.name)).ratio()
            if ratio > best:
                best, best_j = ratio, j
        if best >= 0.85:
            print(f"   🔀 Fuzzy match ({best:.2f}): {best_j.name}")
            return best_j
        return None

    for s_pdf in sorted(savollar):
        base = normalise(s_pdf.name)
        j_pdf = best_javob_match(base, javoblar)
        if j_pdf:
            paired.add(s_pdf)
            paired.add(j_pdf)
            qs = process_pair(s_pdf, j_pdf, existing)
            for q in qs:
                if q["text"][:60] not in existing_texts:
                    new_questions.append(q)
                    existing_texts.add(q["text"][:60])

    # ── Process unpaired / standalone PDFs ──
    standalone = all_pdfs - paired
    skip_names = {"ona_tili_savollar.pdf"}  # skip huge files
    for pdf in sorted(standalone):
        if pdf.name in skip_names:
            print(f"\n⏭️  {pdf.name} o'tkazildi (hajmi juda katta)")
            continue
        qs = process_standalone(pdf)
        for q in qs:
            if q["text"][:60] not in existing_texts:
                new_questions.append(q)
                existing_texts.add(q["text"][:60])

    # ── Save ──
    all_questions = existing + new_questions
    OUTPUT.write_text(json.dumps(all_questions, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n{'=' * 48}")
    print(f"✅ Yangi savollar: {len(new_questions)} ta")
    print(f"📊 Jami: {len(all_questions)} ta savol")
    print(f"💾 Saqlandi: {OUTPUT}")

    # Subject breakdown
    from collections import Counter
    counts = Counter(q["subject"] for q in all_questions)
    for subj, cnt in counts.most_common():
        print(f"   {subj}: {cnt} ta")


if __name__ == "__main__":
    main()
