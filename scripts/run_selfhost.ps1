# Run self-host from Windows via WSL (default distro, e.g. Ubuntu).
# Usage: .\scripts\run_selfhost.ps1
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path (Split-Path -Parent $PSScriptRoot) '.')).Path
$wslPath = ('/mnt/' + $root.Substring(0, 1).ToLower() + $root.Substring(2)).Replace('\', '/')
$cmd = "cd $wslPath && ./run_selfhost.sh"
Write-Host "Using default WSL"
wsl -e sh -c $cmd
if ($LASTEXITCODE -eq 0) { exit 0 }
$distros = @('Ubuntu', 'Debian', 'kali-linux')
foreach ($d in $distros) {
  try {
    wsl -d $d -e true 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { Write-Host "Using WSL distro: $d"; wsl -d $d -e sh -c $cmd; exit $LASTEXITCODE }
  } catch {}
}
wsl -e sh -c $cmd
exit $LASTEXITCODE
