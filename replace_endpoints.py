# Python script to replace hardcoded localhost endpoints with production API_BASE_URL configuration
import os

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

for rel_path in files:
    full_path = os.path.join(base_dir, rel_path)
    if os.path.exists(full_path):
        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Check and inject import if missing
        if "API_BASE_URL" not in content:
            import_str = 'import { API_BASE_URL } from "@/utils/api";\n'
            if '"use client";' in content:
                content = content.replace('"use client";', '"use client";\n\n' + import_str)
            else:
                content = import_str + content
        
        # Replace endpoints
        content = content.replace("http://localhost:8000/api/", "{API_BASE_URL}/api/")
        content = content.replace("http://localhost:8000/api", "{API_BASE_URL}/api")
        content = content.replace("`http://localhost:8000/api/", "`{API_BASE_URL}/api/")
        
        # Fix string interpolation brackets
        content = content.replace("fetch({API_BASE_URL}", "fetch(`${API_BASE_URL}")
        content = content.replace("fetch(API_BASE_URL", "fetch(`${API_BASE_URL}`")
        
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Processed {rel_path} successfully.")
    else:
        print(f"Warning: File not found {rel_path}")
