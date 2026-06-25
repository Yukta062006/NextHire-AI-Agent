# PowerShell script to replace hardcoded localhost endpoints with production API_BASE_URL configuration

$files = @(
    "src/app/dashboard/recruiter/page.tsx",
    "src/app/dashboard/page.tsx",
    "src/app/dashboard/live-interview/page.tsx",
    "src/app/dashboard/jd-analyzer/page.tsx",
    "src/app/dashboard/career-coach/page.tsx",
    "src/app/dashboard/achievements/page.tsx",
    "src/app/signup/page.tsx",
    "src/app/onboarding/page.tsx",
    "src/app/login/page.tsx"
)

foreach ($file in $files) {
    $path = "d:/Innovative Projects/NextHire/$file"
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        
        # Check if already imported
        if ($content -notmatch "API_BASE_URL") {
            # Add import after client directive
            if ($content -match '"use client";') {
                $content = $content -replace '"use client";', "`"use client`";`n`nimport { API_BASE_URL } from `\"@/utils/api`\";"
            } else {
                $content = "import { API_BASE_URL } from `\"@/utils/api`\";`n" + $content
            }
        }
        
        # Replace endpoints
        $content = $content -replace "http://localhost:8000/api/", "`${API_BASE_URL}/api/"
        $content = $content -replace "http://localhost:8000/api", "`${API_BASE_URL}/api"
        
        # Special case for live-interview page template
        $content = $content -replace '`http://localhost:8000/api/', '`${API_BASE_URL}/api/'
        
        Set-Content $path $content
        Write-Host "Processed $file successfully."
    } else {
        Write-Warning "File not found: $file"
    }
}
