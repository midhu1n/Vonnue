import glob
import re
import os

logs = glob.glob(r'C:\Users\HP\.gemini\antigravity\brain\**\.system_generated\logs\overview.txt', recursive=True)

pattern = re.compile(r'<USER_REQUEST>\s*(.*?)\s*</USER_REQUEST>', re.DOTALL)
pattern_user = re.compile(r'^USER:\s*(.*?)$', re.MULTILINE)

found = set()
for log in logs:
    try:
        with open(log, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            matches = pattern.findall(content)
            for m in matches:
                p = m.strip()
                p_lower = p.lower()
                if 'step' in p_lower and '1' in p_lower and '2' in p_lower and '3' in p_lower:
                    found.add(p)
            
            matches2 = pattern_user.findall(content)
            for m in matches2:
                p = m.strip()
                p_lower = p.lower()
                if 'step' in p_lower and '1' in p_lower and '2' in p_lower and '3' in p_lower:
                    found.add(p)
    except:
        pass

with open(r'C:\Users\HP\Desktop\Vonnue Home Assignment\all_step_prompts.txt', 'w', encoding='utf-8') as f:
    for p in found:
        f.write("---PROMPT START---\n")
        f.write(p)
        f.write("\n---PROMPT END---\n\n")

print(f"Found {len(found)} prompts with step, 1, 2, 3")
