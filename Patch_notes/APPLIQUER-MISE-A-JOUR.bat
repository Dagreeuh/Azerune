@echo off
set SRC=%~dp0
xcopy "%SRC%src" "%CD%\src" /E /Y /I
copy /Y "%SRC%package.json" "%CD%\package.json"
echo Mise a jour v1.8 appliquee.
pause
