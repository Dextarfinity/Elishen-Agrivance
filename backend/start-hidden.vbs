' Starts the Elishen Agrivance backend without a console window (used by Task Scheduler at logon)
Dim sh
Set sh = CreateObject("Wscript.Shell")
sh.Run "cmd /c cd /d ""C:\Users\PC\OneDrive\Desktop\bookkeeping-app\backend"" && node index.js", 0, False
