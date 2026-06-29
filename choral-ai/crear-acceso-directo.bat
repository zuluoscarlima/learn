@echo off
REM ============================================================
REM  Crea el acceso directo "Choral AI" (con icono) en tu Escritorio.
REM  Haz DOBLE CLIC en este archivo UNA vez.
REM ============================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0crear-acceso-directo.ps1"
echo.
pause
