# Geo SEO URL migration: foo.html -> foo/index.html + redirect stubs + bulk URL updates
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

# --- Phase 2a: Restructure files ---
$excludeIndexPaths = @(
    'index.html',
    'en\index.html',
    'projecten\index.html',
    'blog\index.html',
    'en\projects\index.html',
    'en\blog\index.html'
)

$migrated = @()
Get-ChildItem -Path $root -Recurse -Filter '*.html' -File | ForEach-Object {
    $rel = $_.FullName.Substring($root.Length + 1).Replace('\', '/')
    $relWin = $rel.Replace('/', '\')
    if ($excludeIndexPaths -contains $relWin) { return }
    if ($_.Name -ne 'index.html') {
        $dirPath = Join-Path $_.DirectoryName $_.BaseName
        $newFile = Join-Path $dirPath 'index.html'
        if (-not (Test-Path $dirPath)) {
            New-Item -ItemType Directory -Path $dirPath -Force | Out-Null
        }
        Move-Item -Path $_.FullName -Destination $newFile -Force
        $migrated += [PSCustomObject]@{
            OldRel = $rel
            NewRel = ($rel -replace '\.html$', '/index.html')
            OldUrl = '/' + ($rel -replace '\.html$', '/')
            NewPath = $newFile
        }
        Write-Host "Moved: $rel -> $($rel -replace '\.html$', '/index.html')"
    }
}

Write-Host "`nMigrated $($migrated.Count) pages"

# --- Phase 2b: Bulk URL replacement ---
function Convert-HtmlUrl {
    param([string]$url)
    if ($url -match '^https?://(?!imetech\.nl)') { return $url }
    if ($url -match '^https?://[^/]+/(.+)$') {
        $path = $Matches[1]
    } elseif ($url -match '^/') {
        $path = $url.TrimStart('/')
    } else {
        return $url
    }
    if ($path -eq 'index.html') { return if ($url -match '^https?://') { 'https://imetech.nl/' } else { '/' } }
    if ($path -eq 'en/index.html') { return if ($url -match '^https?://') { 'https://imetech.nl/en/' } else { '/en/' } }
    if ($path -match '^(.+)/index\.html$') {
        $section = $Matches[1]
        return if ($url -match '^https?://') { "https://imetech.nl/$section/" } else { "/$section/" }
    }
    if ($path -match '\.html$') {
        $newPath = $path -replace '\.html$', '/'
        return if ($url -match '^https?://') { "https://imetech.nl/$newPath" } else { "/$newPath" }
    }
    return $url
}

$textFiles = @()
$textFiles += Get-ChildItem -Path $root -Recurse -Include '*.html','*.xml','*.rss','*.txt','*.js' -File |
    Where-Object { $_.FullName -notmatch '\\components\\' -or $_.Extension -in '.html' }
$textFiles += Get-ChildItem -Path (Join-Path $root 'components') -Filter '*.html' -File -ErrorAction SilentlyContinue
$textFiles += Get-ChildItem -Path $root -Filter 'script.js' -File
$textFiles += Get-ChildItem -Path $root -Filter 'sitemap*.xml' -File
$textFiles += Get-ChildItem -Path $root -Filter 'sitemap.rss' -File
$textFiles += Get-ChildItem -Path $root -Filter 'llms.txt' -File
$textFiles += Get-ChildItem -Path $root -Filter 'robots.txt' -File
$textFiles = $textFiles | Sort-Object FullName -Unique

foreach ($file in $textFiles) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $orig = $content

    # Absolute imetech.nl URLs ending in .html
    $content = [regex]::Replace($content, 'https://imetech\.nl/([^"''\s<>]+)\.html', {
        param($m)
        $path = $m.Groups[1].Value
        if ($path -eq 'index') { return 'https://imetech.nl/' }
        if ($path -eq 'en/index') { return 'https://imetech.nl/en/' }
        if ($path -match '^(.+)/index$') { return "https://imetech.nl/$($Matches[1])/" }
        return "https://imetech.nl/$path/"
    })

    # Root-relative href/src paths ending in .html
    $content = [regex]::Replace($content, '(href|content|src)="(/[^"]*?)\.html"', {
        param($m)
        $attr = $m.Groups[1].Value
        $path = $m.Groups[2].Value
        if ($path -eq '/index') { return "${attr}=`"/`"" }
        if ($path -eq '/en/index') { return "${attr}=`"/en/`"" }
        if ($path -match '^/(.+)/index$') { return "${attr}=`"/$($Matches[1])/`"" }
        return "${attr}=`"$path/`""
    })

    # script.js map keys/values: '/path/foo.html'
    $content = [regex]::Replace($content, "'(/[^']*?)\.html'", {
        param($m)
        $path = $m.Groups[1].Value
        if ($path -eq '/index') { return "'/'" }
        if ($path -eq '/en/index') { return "'/en/'" }
        if ($path -match '^/(.+)/index$') { return "'/$($Matches[1])/'" }
        return "'$path/'"
    })

    if ($content -ne $orig) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        Write-Host "Updated URLs: $($file.Name)"
    }
}

# --- Phase 2c: Redirect stubs ---
$stubNl = @'
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <link rel="canonical" href="https://imetech.nl{0}">
  <meta http-equiv="refresh" content="0;url={0}">
  <script>location.replace('{0}');</script>
</head>
<body><p><a href="{0}">Doorverwijzen…</a></p></body>
</html>
'@

$stubEn = @'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <link rel="canonical" href="https://imetech.nl{0}">
  <meta http-equiv="refresh" content="0;url={0}">
  <script>location.replace('{0}');</script>
</head>
<body><p><a href="{0}">Redirecting…</a></p></body>
</html>
'@

foreach ($item in $migrated) {
    $oldPath = Join-Path $root ($item.OldRel.Replace('/', '\'))
    $isEn = $item.OldRel -match '^en/'
    $stub = if ($isEn) { $stubEn } else { $stubNl }
    $stubContent = $stub -f $item.OldUrl
    [System.IO.File]::WriteAllText($oldPath, $stubContent)
    Write-Host "Stub: $($item.OldRel)"
}

Write-Host "`nDone. Migrated: $($migrated.Count), stubs: $($migrated.Count)"
