# Use ZCC from Windows: run zcc in WSL (default distro, e.g. Ubuntu). Builds zcc if needed, then compiles.
# Usage: .\scripts\use_zcc.ps1 hello.c -o hello.s
# Then in WSL: gcc -o hello hello.s -lm && ./hello
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path (Split-Path -Parent $PSScriptRoot) '.')).Path
$wslPath = ('/mnt/' + $root.Substring(0,1).ToLower() + $root.Substring(2)).Replace('\', '/')
$argsStr = ($args | ForEach-Object { "'$_'" }) -join ' '
$cmd = "cd $wslPath && ./scripts/use_zcc.sh $argsStr"
# Prefer default WSL (no -d); then try named distros if you have multiple
wsl -e sh -c $cmd
if ($LASTEXITCODE -eq 0) { exit 0 }
foreach ($d in @('Ubuntu', 'Debian', 'kali-linux')) {
  try { wsl -d $d -e true 2>$null | Out-Null; if ($LASTEXITCODE -eq 0) { wsl -d $d -e sh -c $cmd; exit $LASTEXITCODE } } catch {}
}
wsl -e sh -c $cmd
