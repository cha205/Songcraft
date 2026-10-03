# "Is the project healthy?" Exit code 0 = safe to commit / hand off. Edit as the stack firms up.
$ErrorActionPreference = 'Continue'
Set-Location (Split-Path $PSScriptRoot -Parent)
$script:failed = $false
$script:ran = 0
function Step($label, $cmd) {
  Write-Host "== $label" -ForegroundColor Cyan
  $script:ran++
  Invoke-Expression $cmd
  if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: $label" -ForegroundColor Red; $script:failed = $true }
}

if (Test-Path package.json) {
  if (-not (Test-Path node_modules)) { Step 'npm install' 'npm install' }
  $s = (Get-Content package.json -Raw | ConvertFrom-Json).scripts
  if ($s.lint)      { Step 'lint'      'npm run lint' }
  if ($s.typecheck) { Step 'typecheck' 'npm run typecheck' }
  if ($s.test)      { Step 'test'      'npm test' }
  if ($s.build)     { Step 'build'     'npm run build' }
}
if ((Test-Path pyproject.toml) -or (Test-Path requirements.txt)) {
  if (Test-Path tests) { Step 'pytest' 'python -m pytest -q' }
}

if ($script:ran -eq 0) { Write-Host 'No checks configured yet - edit scripts/check.ps1' -ForegroundColor Yellow }
if ($script:failed) { Write-Host 'CHECK FAILED' -ForegroundColor Red; exit 1 }
Write-Host 'CHECK PASSED' -ForegroundColor Green
exit 0
