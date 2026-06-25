import os
import re

files = [
    "src/app/dashboard/recruiter/page.tsx",
    "src/app/dashboard/page.tsx",
    "src/app/dashboard/live-interview/page.tsx",
    "src/app/dashboard/jd-analyzer/page.tsx",
    "src/app/dashboard/career-coach/page.tsx",
    "src/app/dashboard/achievements/page.tsx",
    "src/app/signup/page.tsx",
    "src/app/onboarding/page.tsx",
    "src/app/login/page.tsx"
]

base_dir = "d:/Innovative Projects/NextHire"

# Double quote pattern: "{API_BASE_URL}/api/something"
dq_pattern = re.compile(r'"{API_BASE_URL}(/api/[^"]*)"')

for rel_path in files:
    full_path = os.path.join(base_dir, rel_path)
    if os.path.exists(full_path):
        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # 1. Convert double quotes to backticks
        content = dq_pattern.sub(r'`${API_BASE_URL}\1`', content)
        
        # 2. Fix the backticked ones that lack a $
        content = content.replace("`{API_BASE_URL}", "`${API_BASE_URL}")
        
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed {rel_path} successfully.")
    else:
        print(f"Warning: File not found {rel_path}")
