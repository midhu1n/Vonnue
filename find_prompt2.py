import glob
import re

logs = glob.glob(r'C:\Users\HP\.gemini\antigravity\brain\**\.system_generated\logs\overview.txt', recursive=True)

pattern = re.compile(r'<USER_REQUEST>\s*(.*?)\s*</USER_REQUEST>', re.DOTALL)
pattern_user = re.compile(r'^USER:\s*(.*?)$', re.MULTILINE)

for log in logs:
    try:
        with open(log, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            matches = pattern.findall(content)
            for m in matches:
                if 'step 4' in m.lower() or 'step4' in m.lower():
                    print("-", m.strip()[:200] + "...")
            
            matches2 = pattern_user.findall(content)
            for m in matches2:
                if 'step 4' in m.lower() or 'step4' in m.lower():
                    print("-", m.strip()[:200] + "...")
    except:
        pass
