@echo off
rem ATLAS hourly cycle wrapper - used by the Windows scheduled task.
cd /d "C:\Users\Administrator\.verdent\verdent-projects\can-you-make-automations"
set "PATH=%PATH%;C:\Program Files\nodejs"
"C:\Program Files\nodejs\node.exe" automation\atlas-worker.mjs
