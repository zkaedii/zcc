# Copy project into Kali home so you can build without "No such device" on D:
# Run from PowerShell in the project folder (or set $src first).

$src = if ($args[0]) { $args[0] } else { "D:\__DOWNLOADS\selforglinux" }
$dest = "\\wsl.localhost\Kali\home\zkaedi\selforglinux"
if (-not (Test-Path $src)) { Write-Error "Source not found: $src"; exit 1 }

Write-Host "Copying $src -> $dest (Kali home)..."
New-Item -ItemType Directory -Force -Path $dest | Out-Null
robocopy $src $dest /E /XD .git _experiment_tmp.build _experiment_tmp.dist .pytest_cache /NFL /NDL /NJH /NJS
Write-Host "Done. In Kali run:"
Write-Host "  cd ~/selforglinux"
Write-Host "  chmod +x scripts/build_and_quick_test.sh"
Write-Host "  ./scripts/build_and_quick_test.sh"
