tasklist /nh /fi "imagename eq chrome.exe" | find /i "chrome.exe" > nul || (start chrome.exe)
start "" "D:\Program Files\Microsoft VS Code\Code.exe"
start explorer.exe shell:appsFolder\GanacheUI_5dg5pnz03psnj!GanacheUI
start cmd.exe /k "cd /d D:\Google Drive\Projekte\Dapp University ERC20 Tutorial"
exit