import os
import glob
import re

components_dir = r"c:\Users\yuvik\Leetcode-Tracker-Frontend\Frontend\src\components\dashboard\student"
files = glob.glob(os.path.join(components_dir, "*.tsx"))
files = [f for f in files if "ProfileStats.tsx" not in f]

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Premium base card class
    premium_class = '<Card className="relative bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-800/50 shadow-2xl rounded-2xl overflow-hidden">'
    content = re.sub(r'<Card className="[^"]+">', premium_class, content)

    # Fix classroom list bad class
    ugly_class = "'bg-transparent border border-zinc-800/80 hover:bg-zinc-900/30 border-zinc-800/80 hover:border-blue-300 :border-blue-800'"
    good_class = "'bg-[#1a1a1a]/40 border border-zinc-800/50 hover:bg-[#1a1a1a]/80 hover:border-zinc-700'"
    content = content.replace(ugly_class, good_class)
    
    # Fix BookOpen color in ClassroomList
    content = content.replace('text-zinc-700"/> My Classrooms', 'text-[#5b4fff]"/> My Classrooms')

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Premium cards applied.")
