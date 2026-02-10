# Script to replace http://localhost:5000 with API_URL across all frontend files
# This script handles both single-quoted and backtick-quoted URLs

$srcDir = "c:\Users\patel\OneDrive\Desktop\deploye\client\src"
$configImport = "import API_URL from '../config';"

# Find all files with localhost:5000 (excluding config.js itself)
$files = Get-ChildItem -Path $srcDir -Recurse -Include "*.jsx","*.js" -Exclude "config.js" | 
    Select-String -Pattern "http://localhost:5000" -List |
    ForEach-Object { $_.Path }

Write-Host "Found $($files.Count) files to update:"

foreach ($file in $files) {
    $fileName = Split-Path $file -Leaf
    Write-Host "Processing: $fileName"
    
    $content = Get-Content $file -Raw -Encoding UTF8
    
    # Determine the correct relative import path based on file location
    $relativePath = [System.IO.Path]::GetRelativePath($srcDir, (Split-Path $file))
    
    # Calculate depth for import path
    if ($relativePath -eq ".") {
        $importPath = "./config"
    } elseif ($relativePath -eq "components") {
        $importPath = "../config"
    } elseif ($relativePath -eq "context") {
        $importPath = "../config"
    } elseif ($relativePath -eq "pages") {
        $importPath = "../config"
    } else {
        # Count directory depth
        $depth = ($relativePath -split "[\\/]").Count
        $importPath = ("../" * $depth) + "config"
    }
    
    $actualImport = "import API_URL from '$importPath';"
    
    # Step 1: Add import if not already present
    if ($content -notmatch "import API_URL") {
        # Add after the last existing import statement
        # Find the last import line
        if ($content -match "(?m)(^import .+$)") {
            # Find position after last import
            $lines = $content -split "`n"
            $lastImportIndex = -1
            for ($i = 0; $i -lt $lines.Count; $i++) {
                if ($lines[$i] -match "^import ") {
                    $lastImportIndex = $i
                }
            }
            if ($lastImportIndex -ge 0) {
                $lines = [System.Collections.ArrayList]@($lines)
                $lines.Insert($lastImportIndex + 1, $actualImport)
                $content = $lines -join "`n"
            }
        }
    }
    
    # Step 2: Replace URLs in single quotes: 'http://localhost:5000/api/xxx' -> `${API_URL}/api/xxx`
    $content = $content -replace "'http://localhost:5000(/[^']*)'", '`${API_URL}$1`'
    
    # Step 3: Replace URLs in backticks (already template literals): `http://localhost:5000/api/xxx/${var}` -> `${API_URL}/api/xxx/${var}`
    $content = $content -replace 'http://localhost:5000', '${API_URL}'
    
    # Write back
    Set-Content $file -Value $content -Encoding UTF8 -NoNewline
    
    Write-Host "  Done: $fileName"
}

Write-Host "`nAll files updated successfully!"
