$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host "=== Validation: internal .html hrefs in content pages (excl. stubs, components, v1) ==="
$htmlHits = @()
Get-ChildItem -Recurse -Filter '*.html' -File | Where-Object {
    $_.FullName -notmatch '\\components\\' -and $_.FullName -notmatch '\\v1\\'
} | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match 'http-equiv="refresh"' -and $content.Length -lt 500) { return }
    $matches = [regex]::Matches($content, 'href="[^"]*\.html[^"]*"')
    foreach ($m in $matches) {
        if ($m.Value -notmatch 'components/') {
            $htmlHits += "$($_.FullName.Substring($root.Length+1)): $($m.Value)"
        }
    }
}
if ($htmlHits.Count -eq 0) {
    Write-Host "PASS: No internal .html hrefs in content pages"
} else {
    Write-Host "FAIL: $($htmlHits.Count) hits:"
    $htmlHits | Select-Object -First 20 | ForEach-Object { Write-Host "  $_" }
}

Write-Host "`n=== Validation: sitemap .html in loc tags ==="
$sitemapHits = Select-String -Path 'sitemap.xml' -Pattern '<loc>[^<]*\.html' -AllMatches
if (-not $sitemapHits) {
    Write-Host "PASS: No .html in sitemap loc tags"
} else {
    Write-Host "FAIL: $($sitemapHits.Count) hits"
    $sitemapHits | Select-Object -First 10 | ForEach-Object { Write-Host "  $($_.Line)" }
}

Write-Host "`n=== Validation: language switcher completeness ==="
$js = Get-Content 'script.js' -Raw
$nlPages = [regex]::Matches($js, "'(/[^']+/)': '/en/[^']+/'") | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
$missing = @()
foreach ($p in $nlPages) {
    if ($p -match '\.html') { continue }
    if ($js -notmatch [regex]::Escape("'$p':")) { $missing += $p }
}
# Check EN trailing-slash pages have reverse mapping
$enPages = [regex]::Matches($js, "'/[^']+': '(/en/[^']+/)'") | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
$enMissing = @()
foreach ($p in $enPages) {
    if ($p -match '\.html') { continue }
    if ($js -notmatch [regex]::Escape("'$p':")) { $enMissing += $p }
}
Write-Host "NL trailing-slash entries in nlToEn: $($nlPages.Count)"
Write-Host "EN trailing-slash entries mapped: $($enPages.Count)"
if ($missing.Count -eq 0 -and $enMissing.Count -eq 0) {
    Write-Host "PASS: Language switcher maps appear complete"
} else {
    Write-Host "WARN: Some paths may need manual check"
}

Write-Host "`n=== Sample redirect stub check ==="
$stub = Get-Content 'contact.html' -Raw
if ($stub -match 'url=/contact/' -and $stub -match 'canonical.*contact/') {
    Write-Host "PASS: contact.html redirect stub OK"
} else {
    Write-Host "FAIL: contact.html redirect stub issue"
}

Write-Host "`n=== Migrated page count (excl. v1, components) ==="
$migrated = (Get-ChildItem -Recurse -Filter 'index.html' -File | Where-Object {
    $_.FullName -notmatch '\\components\\' -and
    $_.Directory.Name -ne 'imetech-website' -and
    $_.Directory.Name -ne 'en' -and
    $_.Directory.Name -notin @('projecten','blog','projects','scripts')
}).Count
Write-Host "Content index.html pages: $migrated"
