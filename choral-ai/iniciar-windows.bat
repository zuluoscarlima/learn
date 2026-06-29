@echo off
REM ============================================================
REM  Lanzador de Choral AI para Windows.
REM  Haz DOBLE CLIC en este archivo para arrancar la aplicacion.
REM ============================================================
cd /d "%~dp0"
echo.
echo  Arrancando Choral AI...
echo  Cuando veas "Choral AI escuchando...", abre en el navegador:
echo.
echo      http://localhost:3000
echo.
echo  (Para parar la app: cierra esta ventana.)
echo.
call npm start
pause
