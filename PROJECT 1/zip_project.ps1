# =====================================================================
# HMS PROJECT ZIP BUNDLER
# Packages all frontend files for Netlify Drop/GitHub deployment
# =====================================================================

$dir = "c:\Users\punee\Documents\LAVAN"
$zipPath = Join-Path $dir "medvitals_project.zip"

# Clean up old zip if exists
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

# Compress only the core web application files (excluding node_modules)
$filesToZip = @(
    (Join-Path $dir "index.html"),
    (Join-Path $dir "style.css"),
    (Join-Path $dir "app.js"),
    (Join-Path $dir "schema.sql")
)

# Verify files exist before zipping
$validFiles = @()
foreach ($file in $filesToZip) {
    if (Test-Path $file) {
        $validFiles += $file
    }
}

if ($validFiles.Count -eq 4) {
    Compress-Archive -Path $validFiles -DestinationPath $zipPath -Force
    Write-Output "======================================================="
    Write-Output "SUCCESS: Project files bundled into 'medvitals_project.zip'!"
    Write-Output "Location: $zipPath"
    Write-Output "======================================================="
} else {
    Write-Error "Error: One or more core application files are missing."
}
