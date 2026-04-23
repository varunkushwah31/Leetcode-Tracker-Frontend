import os
import glob
import re

components_dir = r"c:\Users\yuvik\Leetcode-Tracker-Frontend\Frontend\src\components\dashboard\student"
files = glob.glob(os.path.join(components_dir, "*.tsx"))

replacements = [
    # ActivityHeatmap.tsx
    ("'bg-emerald-200 '", "'bg-[#5b4fff]/30'"),
    ("'bg-emerald-400 '", "'bg-[#5b4fff]/50'"),
    ("'bg-emerald-600 '", "'bg-[#5b4fff]/70'"),
    ("'bg-emerald-800 '", "'bg-[#5b4fff]'"),
    ("text-emerald-500", "text-[#5b4fff]"),
    
    # Icons
    ("text-blue-500", "text-[#5b4fff]"),
    ("text-blue-600", "text-[#5b4fff]"),
    ("hover:text-blue-700", "hover:text-[#968fff]"),
    (":text-blue-300", "hover:text-[#b4afff]"),
    
    # ClassroomList.tsx selected state
    ("'bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-500 '", "'bg-[#5b4fff]/10 border-[#5b4fff]/50 shadow-lg ring-1 ring-[#5b4fff]/50'"),
    ("'text-blue-900 '", "'text-[#968fff]'"),
    ("'text-blue-500 '", "'text-[#5b4fff]'"),
    
    # ProfileStats.tsx
    ("bg-blue-50", "bg-[#1a1b2e]"),
    ("text-emerald-600", "text-emerald-500"), # Just standardizing
    
    # Fix remaining trailing spaces in classes
    (" '}", "'}"),
    (" '`", "'`"),
]

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Final theme adjustments done.")
