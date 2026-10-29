@echo off
title Kirim Kode ke GitHub - Sistem Absensi SD
echo ====================================================================
echo MENGIRIM KODE SISTEM ABSENSI DAN NILAI SD KE GITHUB ANDA
echo Repositori: https://github.com/muhammad0413-coder/absennilaisd.git
echo ====================================================================
echo.
cd /d "d:\VIVTA LUSIANA\absen"
echo Sedang menghubungi GitHub...
echo Jika jendela login muncul, klik "Sign in with your browser" untuk mengizinkan.
echo.
git push -u origin master
echo.
if %ERRORLEVEL% EQU 0 (
    echo ====================================================================
    echo [SUKSES!] Seluruh kode berhasil terkirim ke GitHub Anda!
    echo Sekarang Anda bisa langsung men-deploy di Vercel: https://vercel.com/new
    echo ====================================================================
) else (
    echo ====================================================================
    echo [CATATAN] Pengiriman memerlukan otorisasi akun GitHub muhammad0413-coder.
    echo Pastikan Anda mengklik "Sign in with your browser" yang muncul di layar.
    echo ====================================================================
)
echo.
pause
