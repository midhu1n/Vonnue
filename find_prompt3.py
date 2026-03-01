import glob
import re

logs = glob.glob(r'C:\Users\HP\.gemini\antigravity\brain\**\.system_generated\logs\overview.txt', recursive=True)

pattern = re.compile(r'<USER_REQUEST>\s*(.*?)\s*</USER_REQUEST>', re.DOTALL)
pattern_user = re.compile(r'^USER:\s*(.*?)$', re.MULTILINE)

found = []
for log in logs:
    try:
        with open(log, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            matches = pattern.findall(content)
            for m in matches:
                if 'step 5' in m.lower() or 'step5' in m.lower():
                    found.append(m.strip())
            
            matches2 = pattern_user.findall(content)
            for m in matches2:
                if 'step 5' in m.lower() or 'step5' in m.lower():
                    found.append(m.strip())
    except:
        pass

for p in found:
    print("--------------------------------------------------")
    print(p[:500])
