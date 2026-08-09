' Starts the Elishen Agrivance backend without a console window (used by Task Scheduler at logon).
' Machine-independent: runs from wherever this script lives, no hardcoded paths.
Dim sh, fso, dir
Set sh = CreateObject("Wscript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
sh.Run "cmd /c cd /d """ & dir & """ && node index.js", 0, False
