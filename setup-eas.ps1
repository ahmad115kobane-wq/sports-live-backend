# EAS Project Setup Script
Write-Host "🚀 إنشاء مشروع EAS..." -ForegroundColor Green
Write-Host "Creating EAS project...`n" -ForegroundColor Green

# Run eas init with automatic yes
Write-Host "📝 تشغيل eas init..." -ForegroundColor Yellow
echo Y | npx eas-cli init

Write-Host "`n✅ تم!" -ForegroundColor Green
Write-Host "Done!`n" -ForegroundColor Green
