$ErrorActionPreference = 'Continue'

$smokes = @(
  'clone_roundtrip',
  'export_smoke',
  'palette_smoke',
  'offline_smoke',
  'phase4_check',
  'phase4_bridge_smoke',
  'phase4_macros_smoke',
  'phase4_shuffle_determinism',
  'prime_lab_smoke',
  'phase4_hamiltonian_smoke',
  'phase4_prime_bridge',
  'phase4_invariants_under_edit',
  'zcc_invariants_under_edit',
  'cheatsheet_check'
)

$totalPass = 0
$totalFail = 0
$totalGhost = 0
$results = @()

foreach ($s in $smokes) {
  $logPath = ".compat_logs/_run_${s}.log"
  $output = & node ".compat_out/${s}.js" 2>&1
  $exitCode = $LASTEXITCODE
  $output | Out-File -Encoding UTF8 -FilePath $logPath
  $text = $output -join "`n"

  # Try to parse various reporter formats.
  $p = 0; $t = 0; $g = 0
  if ($text -match '(\d+)/(\d+)\s+checks passed(?:\s+\(\+\s+(\d+)\s+ghost-ref warnings\))?') {
    $p = [int]$Matches[1]
    $t = [int]$Matches[2]
    if ($Matches[3]) { $g = [int]$Matches[3] }
  } elseif ($text -match 'PASS\s+(\d+)\/(\d+)') {
    $p = [int]$Matches[1]
    $t = [int]$Matches[2]
  } elseif ($text -match 'pass=(\d+)\s+fail=(\d+)') {
    $p = [int]$Matches[1]
    $f = [int]$Matches[2]
    $t = $p + $f
  }

  $totalPass += $p
  $totalFail += ($t - $p)
  $totalGhost += $g

  $status = if ($exitCode -eq 0) { 'OK ' } else { 'FAIL' }
  $results += [pscustomobject]@{
    Smoke    = $s
    Status   = $status
    Pass     = $p
    Total    = $t
    Ghost    = $g
    ExitCode = $exitCode
  }
}

Write-Output ""
Write-Output "Suite Summary"
Write-Output "============="
$results | Format-Table -AutoSize | Out-String -Stream | ForEach-Object { Write-Output $_ }
Write-Output ""
Write-Output "Aggregate: $totalPass / $($totalPass + $totalFail) checks passed across $($smokes.Count) smokes"
if ($totalGhost -gt 0) { Write-Output "           + $totalGhost ghost-ref warnings (soft, non-blocking)" }
$anyFail = ($results | Where-Object { $_.ExitCode -ne 0 }).Count
if ($anyFail -gt 0) {
  Write-Output ""
  Write-Output "FAILED smokes:"
  $results | Where-Object { $_.ExitCode -ne 0 } | ForEach-Object { Write-Output "  - $($_.Smoke) (exit=$($_.ExitCode))" }
  exit 1
}
Write-Output ""
Write-Output "All $($smokes.Count) smokes exited 0."
