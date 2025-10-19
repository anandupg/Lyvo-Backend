@echo off
echo Stopping User Service on port 4002...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4002') do (
    echo Killing process %%a
    taskkill /PID %%a /F
)
echo Service stopped.
