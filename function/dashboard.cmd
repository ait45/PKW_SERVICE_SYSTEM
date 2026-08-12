@echo off
chcp 65001
setlocal enabledelayedexpansion
title PKW Service Dashboard
color 0B

:setTarget
cls
echo =============================================
echo             PKW Service Dashboard
echo =============================================
echo.
echo ใส้เป้าหมายที่จพตรวจสอบ
echo   - ถ้าขึ้นอออนไลน์แล้ว  : ใส่โดเมน เช่น google.com
echo   - ถ้ารันอยู่ในเครื่องตัวเอง : ใส่ localhost:3000 หรือ 127.0.0.1:8080
echo.
set /p target=เป้าหมาย:
if "%target%"=="" goto setTarget

:menu
cls
echo =============================================
echo      PKW Service Dashboard: %target%
echo =============================================
echo.
echo  [1] เช็คสถานะเว็บ (HTTP Status + เวลาโหลด)
echo  [2] ดู HTTP Response Headers
echo  [3] Ping
echo  [4] Traceroute
echo  [5] เช็ค DNS (nslookup) - ใช้กับโดเมนออนไลน์เท่านั้น
echo  [6] เช็ค Port ที่เปิดอยู่ (สำหรับ local dev server)
echo  [7] ดู Process ที่ใช้ Port นั้น (local)
echo  [8] Auto-refresh สภานะเว็บทุก 5 วินาที (กด Ctrl+C เพื่อหยุด)
echo  [9] เปลี่ยนเป้าหมาย
echo  [0] ออกจากโปรแกรม
echo.
set /p choice=เลือกเมนู (0-9):

if "%choice%"=="1" goto status
if "%choice%"=="2" goto headers
if "%choice%"=="3" goto ping
if "%choice%"=="4" goto trace
if "%choice%"=="5" goto dns
if "%choice%"=="6" goto port
if "%choice%"=="7" goto portprocess
if "%choice%"=="8" goto autoRefresh
if "%choice%"=="9" goto setTarget
if "%choice%"=="0" exit

goto menu

:status 
cls
echo กำลังเช็คสถานะ http://%target% ...
echo.
curl -s -o nul -w "HTTP Status: %%{http_code}\nเวลาที่ใช้: %%{time_total} วินาที}\nขนาดข้อมูล: %%{size_download} bytes\n" http://%target%
echo.
echo (ถ้าเว็บใช้ https ให้เปลี่ยนเป็น https:// เอง หรือลอง https ถ้า http ไม่ตอยสนอง)
echo.
pause
goto menu

:headers
cls
echo กำลังดึง HTTP Headers จาก http://%target% ...
echo (Header คือข้อมูลเบื้องหลังที่เซิร์ฟเวอร์ส่งมาก่อนเนื้อหาเว็บ เช่น server, content-type, cache)
echo.
curl -I http://%target%
echo.
pause
goto menu
 
:ping
cls
for /f "tokens=1 delims=:" %%a in ("%target%") do set pinghost=%%a
ping %pinghost%
echo.
pause
goto menu
 
:trace
cls
for /f "tokens=1 delims=:" %%a in ("%target%") do set tracehost=%%a
echo กำลังดูเส้นทาง network ไปยัง %tracehost% ...
tracert %tracehost%
echo.
pause
goto menu
 
:dns
cls
for /f "tokens=1 delims=:" %%a in ("%target%") do set dnshost=%%a
nslookup %dnshost%
echo.
pause
goto menu
 
:port
cls
for /f "tokens=2 delims=:" %%p in ("%target%") do set targetport=%%p
if "%targetport%"=="" (
  echo ไม่พบเลขพอร์ตใน target - ต้องใส่แบบ localhost:3000 ถึงจะเช็คได้
) else (
  echo กำลังเช็คว่า port %targetport% เปิดอยู่ไหม ...
  echo.
  netstat -ano | findstr :%targetport%
  echo.
  echo (คอลัมน์สุดท้ายคือ PID ของโปรแกรมที่เปิด port นี้อยู่)
)
echo.
pause
goto menu
 
:portprocess
cls
for /f "tokens=2 delims=:" %%p in ("%target%") do set targetport2=%%p
if "%targetport2%"=="" (
  echo ไม่พบเลขพอร์ตใน target - ต้องใส่แบบ localhost:3000 ถึงจะเช็คได้
  echo.
  pause
  goto menu
)
set foundpid=
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%targetport2% ^| findstr LISTENING') do set foundpid=%%a
if "%foundpid%"=="" (
  echo ไม่พบ process ที่กำลัง listen อยู่ที่ port %targetport2%
  echo เซิร์ฟเวอร์ dev ของคุณอาจยังไม่ได้รันอยู่
) else (
  echo Port %targetport2% ถูกใช้งานโดย PID: %foundpid%
  echo.
  tasklist /fi "PID eq %foundpid%"
)
echo.
pause
goto menu
 
:autorefresh
cls
echo Auto-refresh สถานะเว็บทุก 5 วินาที
echo กด Ctrl+C แล้วตอบ Y เพื่อหยุด
echo.
:refreshloop
echo [%date% %time%]
curl -s -o nul -w "HTTP Status: %%{http_code} | เวลาโหลด: %%{time_total} วิ\n" http://%target%
timeout /t 5 >nul
goto refreshloop
