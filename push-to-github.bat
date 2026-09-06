@echo off
title Push to GitHub - AI Mock Interview Platform
cd /d "%~dp0"
echo ========================================================
echo   Pushing AI Mock Interview Platform to GitHub...
echo ========================================================
echo.
git push -u origin main
echo.
echo ========================================================
pause
