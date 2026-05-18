@echo off
REM Coloca o Node.js oficial no PATH e executa o comando passado (ex.: npm run db:migrate).
REM Use se o PowerShell disser que "npm" ou "node" nao sao reconhecidos.
if not defined NODEJS_HOME set "NODEJS_HOME=C:\Program Files\nodejs"
set "PATH=%NODEJS_HOME%;%PATH%"
call %*
