import glob
import os
import re

brain_dir = r'C:\Users\HP\.gemini\antigravity\brain'

# Look for folders with relevant metadata summaries
# Check walkthrough and implementation plan files for prompts/context

vonnue_keywords = ['decision', 'laptop', 'criteria', 'weight', 'option', 'normalize', 
                   'wsm', 'sidebar', 'recharts', 'export', 'django', 'vonnue', 
                   'mcda', 'score', 'ranked', 'tip', 'globe', 'hero', 'search bar',
                   'what matters', 'companion', 'analysis page', 'results page',
                   'refining weight', 'dual ai', 'fallback', 'build process']

all_convos = [f for f in os.listdir(brain_dir) 
              if os.path.isdir(os.path.join(brain_dir, f)) and f != 'tempmediaStorage']

found = []

for convo_id in all_convos:
    folder = os.path.join(brain_dir, convo_id)
    
    # Read metadata files
    meta_files = (glob.glob(os.path.join(folder, '*.metadata.json')) + 
                  glob.glob(os.path.join(folder, 'walkthrough.md')) +
                  glob.glob(os.path.join(folder, 'walkthrough.md.resolved*')) +
                  glob.glob(os.path.join(folder, 'implementation_plan.md.resolved*')))
    
    is_vonnue = False
    earliest_mtime = float('inf')
    
    for mp in meta_files:
        try:
            mtime = os.path.getmtime(mp)
            if mtime < earliest_mtime:
                earliest_mtime = mtime
            with open(mp, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read().lower()
                if any(k in content for k in vonnue_keywords):
                    is_vonnue = True
        except:
            pass
    
    if is_vonnue and earliest_mtime < float('inf'):
        # Read the implementation plans / walkthroughs to extract USER objective
        for mp in (glob.glob(os.path.join(folder, 'implementation_plan.md')) +
                   glob.glob(os.path.join(folder, 'walkthrough.md'))):
            try:
                with open(mp, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                # Read first 800 chars as the intent summary
                found.append((earliest_mtime, convo_id, os.path.basename(mp), content[:800]))
            except:
                pass

# Sort by time
found.sort(key=lambda x: x[0])

# Write output
with open(r'C:\Users\HP\Desktop\Vonnue Home Assignment\vonnue_session_summary.txt', 'w', encoding='utf-8') as f:
    for mtime, cid, fname, content in found:
        import datetime
        date_str = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d')
        f.write(f"\n{'='*60}\n")
        f.write(f"DATE: {date_str} | CONV: {cid[:8]}... | FILE: {fname}\n")
        f.write('='*60 + "\n")
        f.write(content[:600] + "\n")

print(f"Found {len(found)} vonnue-related session docs")
for mtime, cid, fname, content in found:
    import datetime
    print(f"  [{datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d')}] {cid[:8]} {fname}")
