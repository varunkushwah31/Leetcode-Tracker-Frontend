import os
import glob

components_dir = r"c:\Users\yuvik\Leetcode-Tracker-Frontend\Frontend\src\components\dashboard\student"
files = glob.glob(os.path.join(components_dir, "*.tsx"))
dashboard_file = r"c:\Users\yuvik\Leetcode-Tracker-Frontend\Frontend\src\pages\StudentDashboard.tsx"

files.append(dashboard_file)

replacements = [
    ("bg-white dark:bg-zinc-900", "bg-[#111111]/85 backdrop-blur-xl border-zinc-800/60"),
    ("bg-zinc-50 dark:bg-[#09090B]", "bg-transparent border border-zinc-800/80 hover:bg-zinc-900/30"),
    ("text-zinc-900 dark:text-white", "text-white tracking-tight"),
    ("text-zinc-500 dark:text-zinc-400", "text-zinc-400"),
    ("border-zinc-200 dark:border-zinc-800", "border-zinc-800/80"),
    ("border-zinc-100 dark:border-zinc-800/50", "border-zinc-800/60"),
    ("border-zinc-200 dark:border-zinc-700", "border-zinc-700"),
    ("bg-blue-50 dark:bg-blue-900/30", "bg-[#1a1b2e]"),
    ("text-blue-600 dark:text-blue-400", "text-[#968fff]"),
    ("text-blue-700 dark:text-blue-500", "text-[#b4afff]"),
    ("bg-zinc-100 dark:bg-zinc-800", "bg-[#1a1a1a]"),
    ("bg-emerald-100 dark:bg-emerald-950", "bg-emerald-950/50"),
    ("bg-amber-100 dark:bg-amber-950", "bg-amber-950/50"),
    ("bg-rose-100 dark:bg-rose-950", "bg-rose-950/50"),
    ("dark:text-zinc-300", "text-zinc-300"),
    ("dark:hover:bg-zinc-800", "hover:bg-zinc-800"),
    ("dark:border-zinc-800/50", "border-zinc-800/50"),
    ("dark:border-zinc-800/30", "border-zinc-800/30"),
    ("text-zinc-700 text-zinc-300", "text-zinc-300"),
    ("text-zinc-700 dark:text-zinc-300", "text-zinc-300"),
    ("text-zinc-400 dark:text-zinc-500", "text-zinc-400"),
    ("text-zinc-600 dark:text-zinc-400", "text-zinc-400"),
    ("text-zinc-900 dark:text-zinc-100", "text-zinc-100"),
    ("bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500", "bg-transparent border border-zinc-700 hover:bg-zinc-800 text-[14px]"),
]

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Replacements done.")
