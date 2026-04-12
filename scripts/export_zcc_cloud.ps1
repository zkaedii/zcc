# Export minimal zcc source for building on a remote Linux server.
# Creates zcc_cloud_export\ with only required .c and .h, then zips to zcc_ready.zip.
# Usage: .\scripts\export_zcc_cloud.ps1  (run from repo root)

$ErrorActionPreference = "Stop"
# Repo root = parent of directory containing this script
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not (Test-Path (Join-Path $Root "zcc.c"))) { Write-Error "zcc.c not found in $Root. Run from repo root: .\scripts\export_zcc_cloud.ps1"; exit 1 }
$ExportDir = Join-Path $Root "zcc_cloud_export"
$ZipPath = Join-Path $Root "zcc_ready.zip"

$Required = @("zcc.c", "zcc_ast_bridge.h", "compiler_passes.c")
$Optional = @("Makefile")

if (Test-Path $ExportDir) { Remove-Item -Recurse -Force $ExportDir }
New-Item -ItemType Directory -Path $ExportDir | Out-Null

foreach ($name in $Required) {
    $src = Join-Path $Root $name
    if (-not (Test-Path $src)) { Write-Error "Required file missing: $src"; exit 1 }
    Copy-Item $src (Join-Path $ExportDir $name)
}
foreach ($name in $Optional) {
    $src = Join-Path $Root $name
    if (Test-Path $src) { Copy-Item $src (Join-Path $ExportDir $name) }
}

$buildTxt = @"
# Build zcc on Linux

Minimal (bootstrap compiler only):
  gcc -O0 -w -fno-asynchronous-unwind-tables -o zcc zcc.c

Full (with IR passes / ZCC_IR_BRIDGE):
  gcc -O0 -w -fno-asynchronous-unwind-tables -o zcc zcc.c compiler_passes.c -lm

Then compile a C file:
  ./zcc yourfile.c -o yourfile.s
  gcc -o yourfile yourfile.s -lm
"@
Set-Content -Path (Join-Path $ExportDir "BUILD.txt") -Value $buildTxt -Encoding UTF8

if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
Compress-Archive -Path $ExportDir -DestinationPath $ZipPath -Force

Write-Host "Created: $ExportDir"
Write-Host "Zipped:  $ZipPath"
