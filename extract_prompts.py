import os
import glob
import re

def extract_strings(filename):
    with open(filename, 'rb') as f:
        data = f.read()
    strings = re.findall(b'[\x20-\x7E\t\n\r]{20,}', data)
    return [s.decode('utf-8', errors='ignore') for s in strings]

pb_files = glob.glob(r'C:\Users\HP\.gemini\antigravity\conversations\*.pb')

prompts_candidate = []
keywords = ['vonnue', 'django', 'react', 'comparison', 'decision', 'laptop']
for pbf in pb_files:
    strs = extract_strings(pbf)
    for s in strs:
        s_lower = s.lower()
        if any(k in s_lower for k in keywords):
            # Exclude code lines, JSON, and assistant markdown formatting usually found in long responses
            if len(s) < 2000 and not any(x in s for x in ['{', '}', 'import ', 'const ', 'export ', 'function', 'class ', 'return ', '```']):
                prompts_candidate.append(s.strip())

# Deduplicate
unique_prompts = list(set(prompts_candidate))

with open(r'C:\Users\HP\Desktop\Vonnue Home Assignment\extracted_pb_prompts.txt', 'w', encoding='utf-8') as f:
    for p in unique_prompts:
        f.write(p + "\n===\n")
