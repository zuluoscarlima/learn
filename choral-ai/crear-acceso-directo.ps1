# Crea un acceso directo "Choral AI" en el Escritorio, con icono propio,
# que arranca la aplicacion (iniciar-windows.bat).
$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot
$desktop = [Environment]::GetFolderPath('Desktop')
$lnk = Join-Path $desktop 'Choral AI.lnk'

$shell = New-Object -ComObject WScript.Shell
$sc = $shell.CreateShortcut($lnk)
$sc.TargetPath = Join-Path $root 'iniciar-windows.bat'
$sc.WorkingDirectory = $root
$sc.IconLocation = (Join-Path $root 'assets\icon.ico')
$sc.Description = 'Choral AI - composicion coral con IA'
$sc.Save()

Write-Host ''
Write-Host 'Listo. Se ha creado el acceso directo "Choral AI" en tu Escritorio.'
Write-Host 'Haz doble clic en el para arrancar la aplicacion.'
