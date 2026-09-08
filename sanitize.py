import pathlib
p = pathlib.Path("generate_pdf.py")
t = p.read_text(encoding="utf-8")
replacements = {
    "—": "-",
    "–": "-",
    "…": "...",
    "→": "->",
    "↔": "<->",
    "•": "-",
    "🇱🇷": "LR",
    "❌": "X",
    "✅": "OK",
    "⚠️": "!",
    "“": '"',
    "”": '"',
    "’": "'",
    "‘": "'",
    "é": "e",
    "è": "e",
    "×": "x",
    "�": "x",
}
for k,v in replacements.items():
    t = t.replace(k, v)
# replace any remaining non-latin1 with ?
t = t.encode('latin-1', errors='replace').decode('latin-1')
p.write_text(t, encoding="utf-8")
print("sanitized")
