import os
import glob
import re

logs = glob.glob(r'C:\Users\HP\.gemini\antigravity\brain\**\.system_generated\logs\overview.txt', recursive=True)

prompts = []
pattern = re.compile(r'<USER_REQUEST>\s*(.*?)\s*</USER_REQUEST>', re.DOTALL)
pattern_user = re.compile(r'^USER:\s*(.*?)$', re.MULTILINE)

for log in logs:
    with open(log, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        # Find XML style
        matches = pattern.findall(content)
        for m in matches:
            if m.strip(): prompts.append(m.strip())
        
        # Find old plaintext style
        matches2 = pattern_user.findall(content)
        for m in matches2:
            if m.strip() and len(m.strip()) > 10: prompts.append(m.strip())

# Filter by keywords to exclude other projects
keywords = ['vonnue', 'django', 'react', 'comparison', 'decision', 'laptop', 'weight', 'score', 'evaluate', 'criteria', 'backend', 'frontend']
filtered = []
for p in prompts:
    p_lower = p.lower()
    if 'nanobanana' in p_lower or 'design diagram' in p_lower or 'component diagram' in p_lower:
        continue
    if any(k in p_lower for k in keywords):
        filtered.append(p)

with open(r'C:\Users\HP\Desktop\Vonnue Home Assignment\extracted_text_prompts.txt', 'w', encoding='utf-8') as f:
    for p in list(set(filtered)):
        p_clean = p.replace('\n', ' ')
        f.write("- " + p_clean + "\n")
