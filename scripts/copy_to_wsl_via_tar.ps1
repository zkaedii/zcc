# Copy selforglinux into WSL home via a tar file on C: (avoids pipe/tar quirks).
# Usage: .\scripts\copy_to_wsl_via_tar.ps1 [DistroName]
# Example: .\scripts\copy_to_wsl_via_tar.ps1 kali-linux

param([string]$Distro = "kali-linux")

$src = "D:\__DOWNLOADS\selforglinux"
if (-not (Test-Path $src)) { Write-Error "Source not found: $src"; exit 1 }

$tarFile = Join-Path $env:USERPROFILE "selforglinux.tar"
$wslTar  = "/mnt/c/Users/$env:USERNAME/selforglinux.tar" -replace '\\', '/'

Write-Host "Creating archive at $tarFile ..."
Set-Location $src
& tar -c --exclude=.git --exclude=__pycache__ --exclude=_experiment_tmp.build --exclude=_experiment_tmp.dist --exclude=.pytest_cache -f $tarFile . 2>&1
if ($LASTEXITCODE -ne 0) { Write-Error "tar create failed"; exit 1 }

Write-Host "Extracting into WSL home (~/selforglinux)..."
wsl -d $Distro -e sh -c "mkdir -p ~/selforglinux && tar -xf $wslTar -C ~/selforglinux"
$extractOk = $LASTEXITCODE

Remove-Item $tarFile -Force -ErrorAction SilentlyContinue
if ($extractOk -eq 0) {
  Write-Host "Done. In Kali run: cd ~/selforglinux && chmod +x scripts/build_and_quick_test.sh && ./scripts/build_and_quick_test.sh"
} else {
  Write-Host "Extract failed. Try in Kali: mkdir -p ~/selforglinux && tar -xf $wslTar -C ~/selforglinux"
}
