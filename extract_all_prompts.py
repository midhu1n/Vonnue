import glob
import os
import json
import re

brain_dir = r'C:\Users\HP\.gemini\antigravity\brain'

# Known Vonnue-related conversation IDs in rough chronological order based on conversation summaries
vonnue_convos = [
    # Earliest - initial project setup
    '87d6f7eb-0386-4b52-b88e-a1f56d2328f2',
    # Then the ones from conversation summaries (in reverse chron, so reversing):
    '57ceb381-9ee0-4ac1-a6f3-8cfc8668fcf0',  # Refining Weight Validation
    '2611c115-871b-408b-bd01-7229c2ab66c8',  # Refining Weight Validation Logic
    '23c79fb5-fe2c-42f7-a3dd-68407a13156d',  # Running the Project
    '5f2e5bfa-caf1-4541-8f3f-52d41dd08ab1',  # Running The Project
    'ee4e8a45-5c95-4d7b-8ec1-96740cd84cf7',  # Refining Results Page
    '4e73d9f8-0ebf-43f3-a50c-ba98c097c285',  # Refining Build Process Docs
    '70a174cf-34ea-45b6-aee0-a653535989b5',  # Implementing Dual AI Fallback
    '8a331e46-57ea-4b8f-ba8b-b40fe52b9e3a',  # Repositioning Background Globe
    'e0298484-65d5-4a3d-9aa7-bc66537bcb1a',  # Current session (sidebar, analysis, docs)
]

# Also scan ALL folders for any Vonnue-related content
all_folders = [f for f in os.listdir(brain_dir) if os.path.isdir(os.path.join(brain_dir, f)) and f not in ['tempmediaStorage']]

# pattern to match user requests in log files
pattern_req = re.compile(r'<USER_REQUEST>\s*(.*?)\s*</USER_REQUEST>', re.DOTALL)
pattern_user = re.compile(r'USER:\s*(.*?)(?=ASSISTANT:|$)', re.DOTALL)

vonnue_keywords = ['decision', 'laptop', 'criteria', 'weight', 'score', 'option', 'normalize', 
                   'wsm', 'mcda', 'sidebar', 'analysis', 'results', 'backend', 'frontier', 
                   'django', 'vonnue', 'build_process', 'research_log', 'frontend.*next',
                   'tip.*weight', 'export', 'print', 'recharts', 'bar chart', 'pie chart',
                   'rate.*option', 'weighted', 'ranking', 'what.*matters']

results = []

for convo_id in all_folders:
    log_path = os.path.join(brain_dir, convo_id, '.system_generated', 'logs', 'overview.txt')
    
    if not os.path.exists(log_path):
        # Try reading metadata or walkthrough files to identify if it's Vonnue-related
        meta_paths = glob.glob(os.path.join(brain_dir, convo_id, '*.metadata.json'))
        is_vonnue = False
        for mp in meta_paths:
            try:
                with open(mp, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read().lower()
                    if any(k in content for k in ['decision', 'laptop', 'criteria', 'weight', 'wsm', 'mcda', 'vonnue']):
                        is_vonnue = True
                        break
            except:
                pass
        
        if not is_vonnue and convo_id not in vonnue_convos:
            continue
    
    if os.path.exists(log_path):
        try:
            with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            mtime = os.path.getmtime(log_path)
            
            # Extract all user requests
            matches = pattern_req.findall(content)
            for m in matches:
                p = m.strip()
                # Filter for Vonnue-relevance
                p_lower = p.lower()
                if any(re.search(k, p_lower) for k in vonnue_keywords) or convo_id in vonnue_convos:
                    results.append((mtime, convo_id, p))
        except Exception as e:
            print(f"Error reading {log_path}: {e}")

# Sort by time
results.sort(key=lambda x: x[0])

# Deduplicate
seen = set()
unique = []
for mtime, cid, p in results:
    key = p.strip()[:200]
    if key not in seen:
        seen.add(key)
        date_str = __import__('datetime').datetime.fromtimestamp(mtime).strftime('%Y-%m-%d')
        unique.append((date_str, cid, p))

# Write output
with open(r'C:\Users\HP\Desktop\Vonnue Home Assignment\all_vonnue_prompts.txt', 'w', encoding='utf-8') as f:
    for date, cid, p in unique:
        f.write(f"[{date}] ({cid[:8]}...)\n")
        f.write(p + "\n")
        f.write("-" * 80 + "\n")

print(f"Found {len(unique)} prompts")
for date, cid, p in unique:
    print(f"[{date}] {p[:100]}")
