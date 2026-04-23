import os
import glob
import re

components_dir = r"c:\Users\yuvik\Leetcode-Tracker-Frontend\Frontend\src\components\dashboard\student"
files = glob.glob(os.path.join(components_dir, "*.tsx"))
dashboard_file = r"c:\Users\yuvik\Leetcode-Tracker-Frontend\Frontend\src\pages\StudentDashboard.tsx"

files.append(dashboard_file)

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove dark:something pattern
    content = re.sub(r'dark:[a-zA-Z0-9_/-]+', '', content)
    # Remove extra spaces
    content = re.sub(r' +', ' ', content)
    content = content.replace(' "', '"').replace('" ', '"')
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Dark classes removed.")
