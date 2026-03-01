import os
import glob
import re
from datetime import datetime

# Target date: Feb 22, 2026
target_date = datetime(2026, 2, 22).timestamp()

logs = glob.glob(r'C:\Users\HP\.gemini\antigravity\brain\**\.system_generated\logs\overview.txt', recursive=True)

prompts = []
pattern = re.compile(r'<USER_REQUEST>\s*(.*?)\s*</USER_REQUEST>', re.DOTALL)
pattern_user = re.compile(r'^USER:\s*(.*?)$', re.MULTILINE)

for log in logs:
    # Check if file was modified/created on or after Feb 22, 2026
    mtime = os.path.getmtime(log)
    if mtime >= target_date:
        with open(log, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            # Find XML style
            matches = pattern.findall(content)
            for m in matches:
                if m.strip(): prompts.append((mtime, m.strip()))
            
            # Find old plaintext style
            matches2 = pattern_user.findall(content)
            for m in matches2:
                if m.strip() and len(m.strip()) > 10: prompts.append((mtime, m.strip()))

# Filter by keywords to exclude other projects
keywords = ['vonnue', 'django', 'react', 'comparison', 'decision', 'laptop', 'weight', 'score', 'evaluate', 'criteria', 'backend', 'frontend']
filtered = []
for mtime, p in prompts:
    p_lower = p.lower()
    if 'nanobanana' in p_lower or 'design diagram' in p_lower or 'component diagram' in p_lower:
        continue
    # Just include all prompts from these recent conversations that might be relevant, 
    # or filter by keyword if we want to be strict. Let's filter to be safe.
    if any(k in p_lower for k in keywords) or "project" in p_lower or "app" in p_lower:
        filtered.append((mtime, p))

# Sort by time
filtered.sort(key=lambda x: x[0])

# Deduplicate while preserving order
seen = set()
unique_prompts = []
for mtime, p in filtered:
    p_clean = p.replace('\n', ' ').strip()
    if p_clean not in seen:
        seen.add(p_clean)
        # Format the date for output
        date_str = datetime.fromtimestamp(mtime).strftime('%Y-%m-%d')
        unique_prompts.append(f"[{date_str}] {p_clean}")

with open(r'C:\Users\HP\Desktop\Vonnue Home Assignment\extracted_prompts_feb22.txt', 'w', encoding='utf-8') as f:
    for p in unique_prompts:
        f.write("- " + p + "\n")
