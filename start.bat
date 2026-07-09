@echo off
title Roulstone Reed Construction - Local Server
echo Starting website at http://localhost:8080
echo.
echo Keep this window open while viewing the site.
echo Press Ctrl+C to stop the server.
echo.
start "" "http://localhost:8080"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"