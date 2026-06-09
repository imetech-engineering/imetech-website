# SEO / conversion bulk updates for IMeTech website
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$assetVersion = '20260608a'

# --- Cache busting ---
Get-ChildItem -Recurse -Filter '*.html' -File | Where-Object {
    $_.FullName -notmatch '\\components\\' -and $_.FullName -notmatch '\\v1\\'
} | ForEach-Object {
    $c = Get-Content $_.FullName -Raw -Encoding UTF8
    $orig = $c
    $c = $c -replace 'href="/style\.css(?:\?v=[^"]*)?"', "href=`"/style.css?v=$assetVersion`""
    $c = $c -replace 'src="/script\.js(?:\?v=[^"]*)?"', "src=`"/script.js?v=$assetVersion`""
    if ($c -ne $orig) {
        [System.IO.File]::WriteAllText($_.FullName, $c, [System.Text.UTF8Encoding]::new($false))
        Write-Host "Cache-bust: $($_.FullName.Substring($root.Length + 1))"
    }
}

# --- Encoding fix ---
@(
    'diensten\softwareontwikkeling\index.html',
    'diensten\data-science-machine-learning\index.html'
) | ForEach-Object {
    $path = Join-Path $root $_
    if (Test-Path $path) {
        $c = Get-Content $path -Raw -Encoding UTF8
        $c = $c -replace 'industriÃ«le', 'industriële'
        [System.IO.File]::WriteAllText($path, $c, [System.Text.UTF8Encoding]::new($false))
        Write-Host "Encoding fix: $_"
    }
}

# --- Tag to service URL maps ---
$nlTagMap = @{
    'PCB' = '/diensten/elektronica-pcb-ontwerp/'
    'ESP32' = '/diensten/softwareontwikkeling/'
    'ESP32-C3' = '/diensten/softwareontwikkeling/'
    'STM32' = '/diensten/softwareontwikkeling/'
    'Embedded' = '/diensten/softwareontwikkeling/'
    'Firmware' = '/diensten/softwareontwikkeling/'
    'IoT' = '/diensten/softwareontwikkeling/'
    'PLC' = '/diensten/softwareontwikkeling/'
    'Modbus' = '/diensten/softwareontwikkeling/'
    'RS-485' = '/diensten/elektronica-pcb-ontwerp/'
    'C++' = '/diensten/softwareontwikkeling/'
    'Python' = '/diensten/softwareontwikkeling/'
    'SolidWorks' = '/diensten/mechanica-cad-tekeningen/'
    '3D Print' = '/diensten/mechanica-cad-tekeningen/'
    'CAD' = '/diensten/mechanica-cad-tekeningen/'
    'Mechanica' = '/diensten/mechanica-cad-tekeningen/'
    'Machine Learning' = '/diensten/data-science-machine-learning/'
    'ML' = '/diensten/data-science-machine-learning/'
    'AI' = '/diensten/data-science-machine-learning/'
    'Productontwikkeling' = '/diensten/productontwikkeling/'
    'Product Development' = '/diensten/productontwikkeling/'
    'Prototype' = '/diensten/productontwikkeling/'
    'Robotica' = '/diensten/softwareontwikkeling/'
    'Automatisering' = '/diensten/softwareontwikkeling/'
    'WAGO' = '/diensten/softwareontwikkeling/'
    'Raspberry Pi' = '/diensten/softwareontwikkeling/'
    'Real-time' = '/diensten/softwareontwikkeling/'
    'Elektronica' = '/diensten/elektronica-pcb-ontwerp/'
    'Hardware' = '/diensten/elektronica-pcb-ontwerp/'
    'PCB Design' = '/diensten/elektronica-pcb-ontwerp/'
    'Render' = '/diensten/mechanica-cad-tekeningen/'
    'Industrial Design' = '/diensten/mechanica-cad-tekeningen/'
}

$enTagMap = @{
    'PCB' = '/en/services/electronics-pcb-design/'
    'ESP32' = '/en/services/software-development/'
    'ESP32-C3' = '/en/services/software-development/'
    'STM32' = '/en/services/software-development/'
    'Embedded' = '/en/services/software-development/'
    'Firmware' = '/en/services/software-development/'
    'IoT' = '/en/services/software-development/'
    'PLC' = '/en/services/software-development/'
    'Modbus' = '/en/services/software-development/'
    'RS-485' = '/en/services/electronics-pcb-design/'
    'C++' = '/en/services/software-development/'
    'Python' = '/en/services/software-development/'
    'SolidWorks' = '/en/services/mechanical-cad-drawings/'
    '3D Print' = '/en/services/mechanical-cad-drawings/'
    'CAD' = '/en/services/mechanical-cad-drawings/'
    'Mechanical' = '/en/services/mechanical-cad-drawings/'
    'Machine Learning' = '/en/services/data-science-machine-learning/'
    'ML' = '/en/services/data-science-machine-learning/'
    'AI' = '/en/services/data-science-machine-learning/'
    'Product Development' = '/en/services/product-development/'
    'Prototype' = '/en/services/product-development/'
    'Robotics' = '/en/services/software-development/'
    'Automation' = '/en/services/software-development/'
    'WAGO' = '/en/services/software-development/'
    'Raspberry Pi' = '/en/services/software-development/'
    'Real-time' = '/en/services/software-development/'
    'Electronics' = '/en/services/electronics-pcb-design/'
    'Hardware' = '/en/services/electronics-pcb-design/'
    'Render' = '/en/services/mechanical-cad-drawings/'
}

function Linkify-Tags($html, $tagMap) {
    foreach ($tag in $tagMap.Keys) {
        $url = $tagMap[$tag]
        $escaped = [regex]::Escape($tag)
        if ($html -match "tag-link`"><span>$escaped</span>") { continue }
        $html = [regex]::Replace($html, "<span>$escaped</span>", "<a href=`"$url`" class=`"tag-link`"><span>$tag</span></a>")
    }
    return $html
}

# --- Blog metadata ---
$blogNl = @{
    'embedded-systemen' = @{
        service = '/diensten/softwareontwikkeling/'
        serviceLabel = 'Embedded software diensten'
        related = @('esp32-vs-stm32', 'softwareontwikkeling-embedded-systemen')
        tagMap = @{
            'Embedded Systemen' = '/diensten/softwareontwikkeling/'
            'Microcontrollers' = '/blog/esp32-vs-stm32/'
            'Firmware' = '/diensten/softwareontwikkeling/'
            'IoT' = '/diensten/productontwikkeling/'
        }
    }
    'esp32-vs-stm32' = @{
        service = '/diensten/softwareontwikkeling/'
        serviceLabel = 'Embedded software diensten'
        related = @('embedded-systemen', 'softwareontwikkeling-embedded-systemen')
        tagMap = @{ 'ESP32' = '/diensten/softwareontwikkeling/'; 'STM32' = '/diensten/softwareontwikkeling/'; 'Embedded' = '/diensten/softwareontwikkeling/' }
    }
    'betrouwbare-printplaten-ontwerpen' = @{
        service = '/diensten/elektronica-pcb-ontwerp/'
        serviceLabel = 'PCB ontwerp diensten'
        related = @('esp32-vs-stm32', 'prototype-naar-productie')
        tagMap = @{ 'PCB' = '/diensten/elektronica-pcb-ontwerp/'; 'Elektronica' = '/diensten/elektronica-pcb-ontwerp/' }
    }
    'softwareontwikkeling-embedded-systemen' = @{
        service = '/diensten/softwareontwikkeling/'
        serviceLabel = 'Softwareontwikkeling'
        related = @('embedded-systemen', 'python-industriele-plc-integratie')
        tagMap = @{ 'Embedded' = '/diensten/softwareontwikkeling/'; 'Firmware' = '/diensten/softwareontwikkeling/' }
    }
    'python-industriele-plc-integratie' = @{
        service = '/diensten/softwareontwikkeling/'
        serviceLabel = 'PLC & software diensten'
        related = @('softwareontwikkeling-embedded-systemen', 'datagedreven-productie')
        tagMap = @{ 'Python' = '/diensten/softwareontwikkeling/'; 'PLC' = '/diensten/softwareontwikkeling/' }
    }
    'machine-learning-productontwikkeling' = @{
        service = '/diensten/data-science-machine-learning/'
        serviceLabel = 'Machine learning diensten'
        related = @('datagedreven-productie', 'automatiseren-sensordata-annotatie')
        tagMap = @{ 'Machine Learning' = '/diensten/data-science-machine-learning/'; 'AI' = '/diensten/data-science-machine-learning/' }
    }
    'datagedreven-productie' = @{
        service = '/diensten/data-science-machine-learning/'
        serviceLabel = 'Data science diensten'
        related = @('machine-learning-productontwikkeling', 'effectieve-dashboards-niet-technisch')
        tagMap = @{ 'Data' = '/diensten/data-science-machine-learning/'; 'Analytics' = '/diensten/data-science-machine-learning/' }
    }
    'automatiseren-sensordata-annotatie' = @{
        service = '/diensten/data-science-machine-learning/'
        serviceLabel = 'ML & data diensten'
        related = @('machine-learning-productontwikkeling', 'datagedreven-productie')
        tagMap = @{ 'Machine Learning' = '/diensten/data-science-machine-learning/'; 'Sensordata' = '/diensten/data-science-machine-learning/' }
    }
    'effectieve-dashboards-niet-technisch' = @{
        service = '/diensten/data-science-machine-learning/'
        serviceLabel = 'Data & analytics diensten'
        related = @('datagedreven-productie', 'python-industriele-plc-integratie')
        tagMap = @{ 'Dashboard' = '/diensten/data-science-machine-learning/'; 'Data' = '/diensten/data-science-machine-learning/' }
    }
    'van-idee-tot-prototype-workflow' = @{
        service = '/diensten/productontwikkeling/'
        serviceLabel = 'Productontwikkeling'
        related = @('concept-ontwikkeling-iteratief-ontwerp', 'prototype-naar-productie')
        tagMap = @{ 'Prototype' = '/diensten/productontwikkeling/'; 'Productontwikkeling' = '/diensten/productontwikkeling/' }
    }
    'concept-ontwikkeling-iteratief-ontwerp' = @{
        service = '/diensten/productontwikkeling/'
        serviceLabel = 'Productontwikkeling'
        related = @('van-idee-tot-prototype-workflow', 'prototype-naar-productie')
        tagMap = @{ 'Concept' = '/diensten/productontwikkeling/'; 'Ontwerp' = '/diensten/productontwikkeling/' }
    }
    'prototype-naar-productie' = @{
        service = '/diensten/productontwikkeling/'
        serviceLabel = 'Productontwikkeling'
        related = @('van-idee-tot-prototype-workflow', 'betrouwbare-printplaten-ontwerpen')
        tagMap = @{ 'Prototype' = '/diensten/productontwikkeling/'; 'Productie' = '/diensten/productontwikkeling/' }
    }
}

$blogEn = @{
    'embedded-systems' = @{ service = '/en/services/software-development/'; serviceLabel = 'Embedded software services'; related = @('esp32-vs-stm32', 'software-development-embedded-systems') }
    'esp32-vs-stm32' = @{ service = '/en/services/software-development/'; serviceLabel = 'Embedded software services'; related = @('embedded-systems', 'software-development-embedded-systems') }
    'reliable-pcb-design' = @{ service = '/en/services/electronics-pcb-design/'; serviceLabel = 'PCB design services'; related = @('esp32-vs-stm32', 'prototype-to-production') }
    'software-development-embedded-systems' = @{ service = '/en/services/software-development/'; serviceLabel = 'Software development'; related = @('embedded-systems', 'python-industrial-plc-integration') }
    'python-industrial-plc-integration' = @{ service = '/en/services/software-development/'; serviceLabel = 'PLC & software services'; related = @('software-development-embedded-systems', 'data-driven-manufacturing') }
    'machine-learning-product-development' = @{ service = '/en/services/data-science-machine-learning/'; serviceLabel = 'Machine learning services'; related = @('data-driven-manufacturing', 'automating-sensor-data-annotation') }
    'data-driven-manufacturing' = @{ service = '/en/services/data-science-machine-learning/'; serviceLabel = 'Data science services'; related = @('machine-learning-product-development', 'effective-dashboards-non-technical') }
    'automating-sensor-data-annotation' = @{ service = '/en/services/data-science-machine-learning/'; serviceLabel = 'ML & data services'; related = @('machine-learning-product-development', 'data-driven-manufacturing') }
    'effective-dashboards-non-technical' = @{ service = '/en/services/data-science-machine-learning/'; serviceLabel = 'Data & analytics services'; related = @('data-driven-manufacturing', 'python-industrial-plc-integration') }
    'from-idea-to-prototype-workflow' = @{ service = '/en/services/product-development/'; serviceLabel = 'Product development'; related = @('concept-development-iterative-design', 'prototype-to-production') }
    'concept-development-iterative-design' = @{ service = '/en/services/product-development/'; serviceLabel = 'Product development'; related = @('from-idea-to-prototype-workflow', 'prototype-to-production') }
    'prototype-to-production' = @{ service = '/en/services/product-development/'; serviceLabel = 'Product development'; related = @('from-idea-to-prototype-workflow', 'reliable-pcb-design') }
}

function Get-BlogTitle($path) {
    $c = Get-Content $path -Raw -Encoding UTF8
    if ($c -match '<h1>([^<]+)</h1>') { return $Matches[1].Trim() }
    return ''
}

function Update-BlogPost($path, $meta, $isEn) {
    if (-not (Test-Path $path)) { return }
    $c = Get-Content $path -Raw -Encoding UTF8
    if ($c -match 'related-articles') { return }

    $slug = Split-Path (Split-Path $path -Parent) -Leaf
    $base = if ($isEn) { '/en/blog/' } else { '/blog/' }
    $contactLabel = if ($isEn) { 'Get in touch' } else { 'Neem contact op' }
    $relatedLabel = if ($isEn) { 'Related articles' } else { 'Gerelateerde artikelen' }

    # Linkify article tags if tagMap exists
    if ($meta.tagMap) {
        foreach ($t in $meta.tagMap.Keys) {
            $url = $meta.tagMap[$t]
            $c = $c -replace "<span>$([regex]::Escape($t))</span>", "<a href=`"$url`" class=`"tag-link`"><span>$t</span></a>"
        }
    } else {
        $c = Linkify-Tags $c $(if ($isEn) { $enTagMap } else { $nlTagMap })
    }

    $relatedHtml = ''
    if ($meta.related) {
        $items = @()
        foreach ($r in $meta.related) {
            $blogRoot = Split-Path (Split-Path $path -Parent) -Parent
            $rPath = Join-Path $blogRoot "$r\index.html"
            if (-not (Test-Path $rPath)) { continue }
            $title = Get-BlogTitle $rPath
            if ($title) {
                $items += "                    <a href=`"$base$r/`" class=`"related-card`"><h3>$title</h3><span class=`"related-arrow`">&rarr;</span></a>"
            }
        }
        if ($items.Count -gt 0) {
            $relatedHtml = @"

        <section class="section section-alt related-articles">
            <div class="wrap">
                <div class="section-header reveal heading-animate">
                    <span class="label">Blog</span>
                    <h2>$relatedLabel</h2>
                </div>
                <div class="related-grid reveal">
$($items -join "`n")
                </div>
            </div>
        </section>
"@
        }
    }

    $ctaPattern = '(?s)(<section class="cta-section">.*?</section>)'
    $newCta = @"
        <section class="cta-section">
            <div class="wrap reveal-blur heading-animate">
                <h2>$(if ($isEn) { 'Ready to discuss your project?' } else { 'Klaar om je project te bespreken?' })</h2>
                <p>$(if ($isEn) { 'Explore relevant services or get in touch for a free consultation.' } else { 'Bekijk relevante diensten of neem contact op voor een vrijblijvend gesprek.' })</p>
                <div class="cta-dual">
                    <a href="$($meta.service)" class="btn btn-primary">$($meta.serviceLabel) <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
                    <a href="$(if ($isEn) { '/en/contact/' } else { '/contact/' })" class="btn btn-outline">$contactLabel</a>
                </div>
            </div>
        </section>
"@

    $c = [regex]::Replace($c, $ctaPattern, $relatedHtml + "`n" + $newCta, 1)
    [System.IO.File]::WriteAllText($path, $c, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Blog updated: $path"
}

foreach ($slug in $blogNl.Keys) {
    Update-BlogPost (Join-Path $root "blog\$slug\index.html") $blogNl[$slug] $false
}
foreach ($slug in $blogEn.Keys) {
    Update-BlogPost (Join-Path $root "en\blog\$slug\index.html") $blogEn[$slug] $true
}

# --- Project service blocks ---
$projectServicesNl = @{
    'carryvision-plantcamerasysteem' = @('/diensten/softwareontwikkeling/', '/diensten/productontwikkeling/')
    'besturing-rollator' = @('/diensten/elektronica-pcb-ontwerp/', '/diensten/softwareontwikkeling/')
    'adresprint-scd30-pcb' = @('/diensten/elektronica-pcb-ontwerp/', '/diensten/softwareontwikkeling/')
    'zelfbalancerende-kubus' = @('/diensten/softwareontwikkeling/', '/diensten/mechanica-cad-tekeningen/')
    'besturingskasten' = @('/diensten/softwareontwikkeling/', '/diensten/elektronica-pcb-ontwerp/')
    '6-dof-spacemouse' = @('/diensten/softwareontwikkeling/', '/diensten/elektronica-pcb-ontwerp/')
    'letterklok' = @('/diensten/elektronica-pcb-ontwerp/', '/diensten/softwareontwikkeling/')
    'laptop-stand' = @('/diensten/mechanica-cad-tekeningen/', '/diensten/productontwikkeling/')
    'smartlamp-pcb' = @('/diensten/elektronica-pcb-ontwerp/', '/diensten/softwareontwikkeling/')
    'usb-c-laad-pcb' = @('/diensten/elektronica-pcb-ontwerp/')
    'magnetische-levitatie-plantenpot' = @('/diensten/elektronica-pcb-ontwerp/', '/diensten/mechanica-cad-tekeningen/')
    'dubbele-labvoeding' = @('/diensten/elektronica-pcb-ontwerp/')
    'multifunctioneel-soldeerstation' = @('/diensten/elektronica-pcb-ontwerp/', '/diensten/mechanica-cad-tekeningen/')
    'fume-extractor' = @('/diensten/mechanica-cad-tekeningen/', '/diensten/elektronica-pcb-ontwerp/')
    'plantsappers-3d-productietekeningen' = @('/diensten/mechanica-cad-tekeningen/', '/diensten/productontwikkeling/')
    'keypad-controller-pcb' = @('/diensten/elektronica-pcb-ontwerp/', '/diensten/softwareontwikkeling/')
    'schets-tot-render' = @('/diensten/mechanica-cad-tekeningen/', '/diensten/productontwikkeling/')
    '2x2-steering-robot' = @('/diensten/softwareontwikkeling/', '/diensten/mechanica-cad-tekeningen/')
    'poc-proximity-chat' = @('/diensten/softwareontwikkeling/', '/diensten/productontwikkeling/')
}

$serviceLabelsNl = @{
    '/diensten/softwareontwikkeling/' = 'Embedded software & PLC'
    '/diensten/elektronica-pcb-ontwerp/' = 'Elektronica & PCB ontwerp'
    '/diensten/mechanica-cad-tekeningen/' = 'Mechanisch ontwerp & CAD'
    '/diensten/data-science-machine-learning/' = 'Data science & ML'
    '/diensten/productontwikkeling/' = 'Productontwikkeling'
}

$projectServicesEn = @{
    'carryvision-plant-camera-system' = @('/en/services/software-development/', '/en/services/product-development/')
    'rollator-control' = @('/en/services/electronics-pcb-design/', '/en/services/software-development/')
    'scd30-address-board' = @('/en/services/electronics-pcb-design/', '/en/services/software-development/')
    'self-balancing-cube' = @('/en/services/software-development/', '/en/services/mechanical-cad-drawings/')
    'control-panels' = @('/en/services/software-development/', '/en/services/electronics-pcb-design/')
    '6-dof-spacemouse' = @('/en/services/software-development/', '/en/services/electronics-pcb-design/')
    'letter-clock' = @('/en/services/electronics-pcb-design/', '/en/services/software-development/')
    'laptop-stand' = @('/en/services/mechanical-cad-drawings/', '/en/services/product-development/')
    'smartlamp-pcb' = @('/en/services/electronics-pcb-design/', '/en/services/software-development/')
    'usb-c-charging-pcb' = @('/en/services/electronics-pcb-design/')
    'magnetic-levitation-planter' = @('/en/services/electronics-pcb-design/', '/en/services/mechanical-cad-drawings/')
    'dual-lab-power-supply' = @('/en/services/electronics-pcb-design/')
    'multifunctional-soldering-station' = @('/en/services/electronics-pcb-design/', '/en/services/mechanical-cad-drawings/')
    'fume-extractor' = @('/en/services/mechanical-cad-drawings/', '/en/services/electronics-pcb-design/')
    'plant-juice-press-3d-production-drawings' = @('/en/services/mechanical-cad-drawings/', '/en/services/product-development/')
    'keypad-controller-pcb' = @('/en/services/electronics-pcb-design/', '/en/services/software-development/')
    'sketch-to-render' = @('/en/services/mechanical-cad-drawings/', '/en/services/product-development/')
    '2x2-steering-robot' = @('/en/services/software-development/', '/en/services/mechanical-cad-drawings/')
    'poc-proximity-chat' = @('/en/services/software-development/', '/en/services/product-development/')
}

$serviceLabelsEn = @{
    '/en/services/software-development/' = 'Embedded software & PLC'
    '/en/services/electronics-pcb-design/' = 'Electronics & PCB design'
    '/en/services/mechanical-cad-drawings/' = 'Mechanical design & CAD'
    '/en/services/data-science-machine-learning/' = 'Data science & ML'
    '/en/services/product-development/' = 'Product development'
}

function Update-ProjectPage($path, $services, $labels, $isEn) {
    if (-not (Test-Path $path)) { return }
    $c = Get-Content $path -Raw -Encoding UTF8
    if ($c -match 'relevant-services') { return }

    $c = Linkify-Tags $c $(if ($isEn) { $enTagMap } else { $nlTagMap })

    $heading = if ($isEn) { 'Relevant services' } else { 'Relevante diensten' }
    $links = @()
    foreach ($s in $services) {
        $label = $labels[$s]
        if ($label) { $links += "                    <a href=`"$s`" class=`"service-link-card`">$label</a>" }
    }
    $block = @"

        <section class="section section-alt relevant-services">
            <div class="wrap">
                <div class="section-header reveal heading-animate">
                    <span class="label">$(if ($isEn) { 'Services' } else { 'Diensten' })</span>
                    <h2>$heading</h2>
                </div>
                <div class="service-links-grid reveal">
$($links -join "`n")
                </div>
            </div>
        </section>
"@

    $c = [regex]::Replace($c, '(?s)(<section class="cta-section">)', $block + "`n        `$1", 1)
    [System.IO.File]::WriteAllText($path, $c, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Project updated: $path"
}

Get-ChildItem (Join-Path $root 'projecten') -Directory | ForEach-Object {
    $slug = $_.Name
    if ($projectServicesNl.ContainsKey($slug)) {
        Update-ProjectPage (Join-Path $_.FullName 'index.html') $projectServicesNl[$slug] $serviceLabelsNl $false
    }
}
Get-ChildItem (Join-Path $root 'en\projects') -Directory | ForEach-Object {
    $slug = $_.Name
    if ($projectServicesEn.ContainsKey($slug)) {
        Update-ProjectPage (Join-Path $_.FullName 'index.html') $projectServicesEn[$slug] $serviceLabelsEn $true
    }
}

Write-Host "`nDone."

# --- Service FAQ + cross-links ---
$serviceFaqsNl = @{
    'softwareontwikkeling' = @{
        cross = @('/diensten/elektronica-pcb-ontwerp/', '/diensten/productontwikkeling/')
        faqs = @(
            @{ q = 'Werkt u met bestaande codebases?'; a = 'Ja. Ik kan bestaande firmware uitbreiden, refactoren of debuggen — van ESP32/STM32-projecten tot PLC-logica.' }
            @{ q = 'Welke platformen ondersteunt u?'; a = 'ESP32, STM32, Arduino, WAGO/Beckhoff PLC, Python backends en C++ real-time systemen.' }
            @{ q = 'Hoe verloopt een typisch traject?'; a = 'Na een kennismaking volgt een requirements-check, proof-of-concept of prototype, en iteratieve oplevering met duidelijke milestones.' }
            @{ q = 'Werkt u ook op afstand?'; a = 'Ja, de meeste softwareprojecten verlopen deels of volledig remote met regelmatige afstemming.' }
        )
    }
    'elektronica-pcb-ontwerp' = @{
        cross = @('/diensten/softwareontwikkeling/', '/diensten/productontwikkeling/')
        faqs = @(
            @{ q = 'Ontwerpt u ook voor productie?'; a = 'Ja. Schema, PCB-layout, BOM en productiedocumentatie worden afgestemd op jouw productiepartner of assemblageproces.' }
            @{ q = 'Welke tools gebruikt u?'; a = 'KiCad voor PCB-ontwerp, plus simulatie en design rule checks voor betrouwbare boards.' }
            @{ q = 'Kan ik alleen schema of layout laten doen?'; a = 'Ja, ik lever ook losse deliverables: schema-ontwerp, PCB-layout of review van bestaande ontwerpen.' }
            @{ q = 'Werkt u ook op afstand?'; a = 'Elektronica-ontwerp leent zich goed voor remote samenwerking; fysieke prototypes kan ik lokaal testen en opsturen.' }
        )
    }
    'mechanica-cad-tekeningen' = @{
        cross = @('/diensten/productontwikkeling/', '/diensten/elektronica-pcb-ontwerp/')
        faqs = @(
            @{ q = 'Welke CAD-software gebruikt u?'; a = 'SolidWorks (CSWP gecertificeerd) voor 3D-modellering, assemblies en productietekeningen.' }
            @{ q = 'Levert u ook productietekeningen?'; a = 'Ja, inclusief maatvoering, tolerances, materiaalspecificaties en STEP/DXF exports voor leveranciers.' }
            @{ q = 'Kunt u ook 3D-print prototypes maken?'; a = 'Ja, ik ontwerp en print functionele prototypes in-house voor snelle validatie.' }
            @{ q = 'Werkt u ook op afstand?'; a = 'CAD-werk en reviews verlopen uitstekend remote; fysieke metingen op locatie zijn mogelijk op afspraak.' }
        )
    }
    'data-science-machine-learning' = @{
        cross = @('/diensten/softwareontwikkeling/', '/diensten/productontwikkeling/')
        faqs = @(
            @{ q = 'Edge ML of cloud?'; a = 'Beide. Van lightweight modellen op embedded hardware tot cloud pipelines — afhankelijk van latency, privacy en schaal.' }
            @{ q = 'Welke data heb ik nodig?'; a = 'Dat hangt af van het doel. Ik help bij data-inventarisatie, annotatie-workflows en het bepalen van minimale dataset-grootte.' }
            @{ q = 'Integreert u met bestaande systemen?'; a = 'Ja, via API-koppelingen, MQTT, databases of directe PLC/MES-integratie.' }
            @{ q = 'Werkt u ook op afstand?'; a = 'Data science en ML-projecten zijn doorgaans volledig remote uitvoerbaar.' }
        )
    }
    'productontwikkeling' = @{
        cross = @('/diensten/softwareontwikkeling/', '/diensten/mechanica-cad-tekeningen/')
        faqs = @(
            @{ q = 'Begeleidt u van idee tot prototype?'; a = 'Ja. Van concept en requirements tot werkend prototype — mechanica, elektronica en software in één traject.' }
            @{ q = 'Werkt u samen met andere leveranciers?'; a = 'Ja, ik kan coördineren met productiepartners, assemblage en externe specialisten waar nodig.' }
            @{ q = 'Wat kost een eerste gesprek?'; a = 'Het kennismakingsgesprek is gratis en vrijblijvend. Daarna volgt een heldere offerte op basis van scope en planning.' }
            @{ q = 'Werkt u ook op afstand?'; a = 'Ja, met regelmatige updates en duidelijke deliverables per fase.' }
        )
    }
}

$serviceFaqsEn = @{
    'software-development' = @{
        cross = @('/en/services/electronics-pcb-design/', '/en/services/product-development/')
        faqs = @(
            @{ q = 'Do you work with existing codebases?'; a = 'Yes. I can extend, refactor or debug existing firmware — from ESP32/STM32 projects to PLC logic.' }
            @{ q = 'Which platforms do you support?'; a = 'ESP32, STM32, Arduino, WAGO/Beckhoff PLC, Python backends and C++ real-time systems.' }
            @{ q = 'What does a typical project look like?'; a = 'After a discovery call: requirements check, proof-of-concept or prototype, and iterative delivery with clear milestones.' }
            @{ q = 'Do you work remotely?'; a = 'Yes, most software projects run partly or fully remote with regular alignment.' }
        )
    }
    'electronics-pcb-design' = @{
        cross = @('/en/services/software-development/', '/en/services/product-development/')
        faqs = @(
            @{ q = 'Do you design for production?'; a = 'Yes. Schematics, PCB layout, BOM and production documentation aligned with your manufacturing partner.' }
            @{ q = 'Which tools do you use?'; a = 'KiCad for PCB design, plus simulation and design rule checks for reliable boards.' }
            @{ q = 'Can I get schematics or layout only?'; a = 'Yes — schematic design, PCB layout or review of existing designs as separate deliverables.' }
            @{ q = 'Do you work remotely?'; a = 'Electronics design works well remotely; physical prototypes are tested locally and can be shipped.' }
        )
    }
    'mechanical-cad-drawings' = @{
        cross = @('/en/services/product-development/', '/en/services/electronics-pcb-design/')
        faqs = @(
            @{ q = 'Which CAD software do you use?'; a = 'SolidWorks (CSWP certified) for 3D modelling, assemblies and production drawings.' }
            @{ q = 'Do you deliver production drawings?'; a = 'Yes, including dimensions, tolerances, material specs and STEP/DXF exports for suppliers.' }
            @{ q = 'Can you 3D print prototypes?'; a = 'Yes, I design and print functional prototypes in-house for rapid validation.' }
            @{ q = 'Do you work remotely?'; a = 'CAD work and reviews run well remotely; on-site measurements are possible by appointment.' }
        )
    }
    'data-science-machine-learning' = @{
        cross = @('/en/services/software-development/', '/en/services/product-development/')
        faqs = @(
            @{ q = 'Edge ML or cloud?'; a = 'Both — from lightweight models on embedded hardware to cloud pipelines, depending on latency, privacy and scale.' }
            @{ q = 'What data do I need?'; a = 'It depends on the goal. I help with data inventory, annotation workflows and minimum dataset sizing.' }
            @{ q = 'Do you integrate with existing systems?'; a = 'Yes, via API connections, MQTT, databases or direct PLC/MES integration.' }
            @{ q = 'Do you work remotely?'; a = 'Data science and ML projects are typically fully remote.' }
        )
    }
    'product-development' = @{
        cross = @('/en/services/software-development/', '/en/services/mechanical-cad-drawings/')
        faqs = @(
            @{ q = 'Do you guide from idea to prototype?'; a = 'Yes — from concept and requirements to working prototype across mechanics, electronics and software.' }
            @{ q = 'Do you work with other suppliers?'; a = 'Yes, I can coordinate with manufacturing partners, assembly and external specialists where needed.' }
            @{ q = 'What does an initial call cost?'; a = 'The discovery call is free and non-binding. A clear quote follows based on scope and timeline.' }
            @{ q = 'Do you work remotely?'; a = 'Yes, with regular updates and clear deliverables per phase.' }
        )
    }
}

function Build-FaqBlock($faqs, $isEn) {
    $label = if ($isEn) { 'FAQ' } else { 'Veelgestelde vragen' }
    $heading = if ($isEn) { 'Frequently asked questions' } else { 'Veelgestelde vragen' }
    $items = ($faqs | ForEach-Object {
        "          <details class=`"faq-item`"><summary>$($_.q)</summary><p>$($_.a)</p></details>"
    }) -join "`n"
    return @"

        <section class="section section-alt faq-section" id="faq">
            <div class="wrap">
                <div class="section-header reveal heading-animate">
                    <span class="label">$label</span>
                    <h2>$heading</h2>
                </div>
                <div class="faq-list reveal">
$items
                </div>
            </div>
        </section>
"@
}

function Build-FaqSchema($faqs) {
    $entities = ($faqs | ForEach-Object {
        "      { `"@type`": `"Question`", `"name`": `"$($_.q)`", `"acceptedAnswer`": { `"@type`": `"Answer`", `"text`": `"$($_.a -replace '"','\"')`" } }"
    }) -join ",`n"
    return @"
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
$entities
    ]
  }
  </script>
"@
}

function Build-CrossLinks($urls, $labels, $isEn) {
    $heading = if ($isEn) { 'Related services' } else { 'Ook relevant' }
    $label = if ($isEn) { 'Services' } else { 'Diensten' }
    $links = ($urls | ForEach-Object {
        "                    <a href=`"$_`" class=`"service-link-card`">$($labels[$_])</a>"
    }) -join "`n"
    return @"

        <section class="section relevant-services cross-services">
            <div class="wrap">
                <div class="section-header reveal heading-animate">
                    <span class="label">$label</span>
                    <h2>$heading</h2>
                </div>
                <div class="service-links-grid reveal">
$links
                </div>
            </div>
        </section>
"@
}

function Update-ServicePage($path, $meta, $labels, $isEn) {
    if (-not (Test-Path $path)) { return }
    $c = Get-Content $path -Raw -Encoding UTF8
    if ($c -match 'faq-section') { return }

    $faqBlock = Build-FaqBlock $meta.faqs $isEn
    $crossBlock = Build-CrossLinks $meta.cross $labels $isEn
    $schemaBlock = Build-FaqSchema $meta.faqs

    $c = $c -replace '</head>', ($schemaBlock + "`n</head>")
    $c = [regex]::Replace($c, '(?s)(<div class="wrap" style="text-align:center;padding:2rem 0">)', ($crossBlock + "`n`n        `$1"), 1)
    if ($c -notmatch 'text-align:center;padding:2rem 0') {
        $c = [regex]::Replace($c, '(?s)(<section class="cta-section">)', ($crossBlock + "`n`n        `$1"), 1)
    }
    $c = [regex]::Replace($c, '(?s)(<section class="cta-section">)', ($faqBlock + "`n        `$1"), 1)
    [System.IO.File]::WriteAllText($path, $c, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Service updated: $path"
}

foreach ($slug in $serviceFaqsNl.Keys) {
    Update-ServicePage (Join-Path $root "diensten\$slug\index.html") $serviceFaqsNl[$slug] $serviceLabelsNl $false
}
foreach ($slug in $serviceFaqsEn.Keys) {
    Update-ServicePage (Join-Path $root "en\services\$slug\index.html") $serviceFaqsEn[$slug] $serviceLabelsEn $true
}

Write-Host "`nService pages done."

