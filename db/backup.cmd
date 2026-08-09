@echo off
rem ============================================================
rem Elishen Agrivance — nightly database backup
rem Compressed pg_dump into db\backups\auto (inside OneDrive, so
rem it syncs offsite automatically). Keeps 30 days of backups.
rem Scheduled task: ElishenBackup (daily 9:00 PM)
rem Restore with:
rem   pg_restore -U postgres -d bookkeeping --clean --if-exists <file.dump>
rem ============================================================
setlocal
set PGPASSWORD=dextar0410
set OUTDIR=C:\Users\PC\OneDrive\Desktop\bookkeeping-app\db\backups\auto
if not exist "%OUTDIR%" mkdir "%OUTDIR%"

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HHmm"') do set STAMP=%%i
"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -U postgres -h localhost -Fc -f "%OUTDIR%\bookkeeping_%STAMP%.dump" bookkeeping
if errorlevel 1 (
  echo BACKUP FAILED %STAMP% >> "%OUTDIR%\backup.log"
  exit /b 1
)
echo OK %STAMP% >> "%OUTDIR%\backup.log"

rem prune backups older than 30 days
powershell -NoProfile -Command "Get-ChildItem '%OUTDIR%\*.dump' | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Force"
exit /b 0
