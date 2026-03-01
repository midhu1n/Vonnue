import glob
import re

logs = glob.glob(r'C:\Users\HP\.gemini\antigravity\brain\**\.system_generated\logs\overview.txt', recursive=True)

pattern = re.compile(r'<USER_REQUEST>\s*(.*?)\s*</USER_REQUEST>', re.DOTALL)
pattern_user = re.compile(r'^USER:\s*(.*?)$', re.MULTILINE)

prompts = []

for log in logs:
    try:
        with open(log, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            matches = pattern.findall(content)
            for m in matches:
                prompts.append(m.strip())
            
            matches2 = pattern_user.findall(content)
            for m in matches2:
                if len(m.strip()) > 10: prompts.append(m.strip())
    except:
        pass

for p in prompts:
    p_lower = p.lower()
    if 'step 1' in p_lower and 'step 2' in p_lower and 'step 3' in p_lower:
        print("FOUND PROMPT:")
        print("-" * 50)
        print(p)
        print("-" * 50)
        break
