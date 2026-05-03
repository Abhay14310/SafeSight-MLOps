@echo off
echo ====================================================
echo    SafeSight-MLOps — Docker Launcher
echo ====================================================
echo.
echo  [1] All projects
echo  [2] SafeSight only     (web-dashboard)        :3000
echo  [3] MedFlow 2 only     (hospital mgmt)        :3010
echo  [4] EcoTrack only      (waste logistics)      :3008
echo  [5] SmartRetail only   (retail intelligence)  :3005
echo  [6] AI Engine only     (YOLOv8 detection)
echo  [7] SafeSight + AI     (core system)
echo  [8] Stop all containers
echo  [9] Stop all and wipe volumes (RESET DATA)
echo.
set /p choice="Enter choice [1-9]: "

if "%choice%"=="1" docker-compose --profile safesight --profile medflow2 --profile ecotrack --profile smartretail --profile ai up --build
if "%choice%"=="2" docker-compose --profile safesight up --build
if "%choice%"=="3" docker-compose --profile medflow2 up --build
if "%choice%"=="4" docker-compose --profile ecotrack up --build
if "%choice%"=="5" docker-compose --profile smartretail up --build
if "%choice%"=="6" docker-compose --profile ai up --build
if "%choice%"=="7" docker-compose --profile safesight --profile ai up --build
if "%choice%"=="8" docker-compose --profile safesight --profile medflow2 --profile ecotrack --profile smartretail --profile ai down
if "%choice%"=="9" docker-compose --profile safesight --profile medflow2 --profile ecotrack --profile smartretail --profile ai down -v

echo.
echo Done.
pause