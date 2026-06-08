$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$files = Get-ChildItem -Recurse -Include '*.html','*.js' -File |
    Where-Object { $_.FullName -notmatch '\\v1\\' -and $_.Name -ne 'migrate-urls.ps1' }

foreach ($file in $files) {
    # Skip redirect stubs (small files with meta refresh)
    $content = [System.IO.File]::ReadAllText($file.FullName)
    if ($content -match 'http-equiv="refresh"' -and $content.Length -lt 500) { continue }

    $orig = $content
    # Anchor links: /foo.html#bar -> /foo/#bar
    $content = $content -replace 'href="(/[^"]*?)\.html(#[^"]*)"', 'href="$1/$2"'
    # Relative ../../contact.html -> /contact/
    $content = $content -replace 'href="\.\./\.\./contact\.html"', 'href="/contact/"'
    $content = $content -replace 'href="\.\./\.\./en/contact\.html"', 'href="/en/contact/"'

    if ($content -ne $orig) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        Write-Host "Fixed: $($file.FullName.Substring($root.Length+1))"
    }
}

Write-Host 'Done fixing remaining URLs'
