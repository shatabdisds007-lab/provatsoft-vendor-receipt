$deps = @(
    @{name="@react-pdf/renderer"; requested="^3.1.0"},
    @{name="@resend/client"; requested="^1.0.0"},
    @{name="@supabase/supabase-js"; requested="^3.10.0"},
    @{name="@tailwindcss/typography"; requested="^0.6.0"},
    @{name="framer-motion"; requested="^11.0.0"},
    @{name="jose"; requested="^5.0.0"},
    @{name="lucide-react"; requested="^0.489.0"},
    @{name="next"; requested="15.2.0"},
    @{name="react"; requested="18.3.1"},
    @{name="react-dom"; requested="18.3.1"},
    @{name="react-hook-form"; requested="^7.45.0"},
    @{name="zod"; requested="^4.25.0"},
    @{name="@hookform/resolvers"; requested="^3.1.0"},
    @{name="@types/node"; requested="^20.14.0"; devDep=$true},
    @{name="@types/react"; requested="^18.3.0"; devDep=$true},
    @{name="@types/react-dom"; requested="^18.3.0"; devDep=$true},
    @{name="@types/qrcode"; requested="^1.5.1"; devDep=$true},
    @{name="autoprefixer"; requested="^10.4.19"; devDep=$true},
    @{name="clsx"; requested="^2.1.1"; devDep=$true},
    @{name="eslint"; requested="^8.57.0"; devDep=$true},
    @{name="eslint-config-next"; requested="^15.2.0"; devDep=$true},
    @{name="postcss"; requested="^8.4.40"; devDep=$true},
    @{name="qrcode"; requested="^1.5.1"; devDep=$true},
    @{name="tailwind-merge"; requested="^1.14.0"; devDep=$true},
    @{name="tailwindcss"; requested="^3.4.4"; devDep=$true},
    @{name="typescript"; requested="^5.6.2"; devDep=$true}
)

Write-Output "DEPENDENCY AUDIT REPORT - $(Get-Date)"
Write-Output "=" * 80
Write-Output ""

$report = @()

foreach ($dep in $deps) {
    $name = $dep.name
    $requested = $dep.requested
    $type = if ($dep.devDep) { "devDep" } else { "prod" }
    
    Write-Output "Checking: $name (requested: $requested, type: $type)"
    
    # Get latest version
    $output = npm view $name version 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $latest = $output | Select-Object -First 1
        $status = "EXISTS"
        $note = ""
    } else {
        $latest = "N/A"
        $status = "NOT_FOUND"
        $note = "Package not found in registry"
    }
    
    # Check specific requested version
    $verifyOutput = npm view "$name@$requested" version 2>&1
    $versionStatus = if ($LASTEXITCODE -eq 0) { "VALID" } else { "INVALID" }
    
    $report += @{
        name = $name
        requested = $requested
        latest = $latest
        status = $status
        versionStatus = $versionStatus
        type = $type
        note = $note
    }
    
    Write-Output "  -> Latest: $latest | Status: $status | Version Match: $versionStatus"
    Write-Output ""
}

Write-Output "=" * 80
Write-Output "AUDIT SUMMARY"
Write-Output "=" * 80
Write-Output ""

$problemDeps = $report | Where-Object { $_.status -eq "NOT_FOUND" -or $_.versionStatus -eq "INVALID" }

if ($problemDeps.Count -gt 0) {
    Write-Output "PROBLEMATIC DEPENDENCIES ($($problemDeps.Count)):"
    Write-Output ""
    foreach ($p in $problemDeps) {
        Write-Output "  - $($p.name)"
        Write-Output "    Requested: $($p.requested)"
        Write-Output "    Status: $($p.status)"
        Write-Output "    Version Valid: $($p.versionStatus)"
        Write-Output "    Latest: $($p.latest)"
        if ($p.note) { Write-Output "    Note: $($p.note)" }
        Write-Output ""
    }
} else {
    Write-Output "No problematic dependencies found."
}

Write-Output ""
Write-Output "PRODUCTION DEPENDENCIES: $($report | Where-Object { $_.type -eq "prod" }).Count"
Write-Output "DEV DEPENDENCIES: $($report | Where-Object { $_.type -eq "devDep" }).Count"
Write-Output "PROBLEMS: $($problemDeps.Count)"
