@echo off
start cmd /k "cd /d %~dp0backend && title PlacaMoto Backend && npm run dev"
start cmd /k "cd /d %~dp0frontend && title PlacaMoto Frontend && npm run dev"
echo Servidores iniciados en segundo plano!
echo Backend: http://localhost:4000
echo Frontend: http://localhost:5173