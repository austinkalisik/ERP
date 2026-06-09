@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File ".\Start-Nextgens-Ticketing.ps1"
