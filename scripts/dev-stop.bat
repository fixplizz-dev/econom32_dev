@echo off
echo 🛑 Остановка локального окружения...

REM Остановка всех сервисов
docker-compose down

echo ✅ Все сервисы остановлены.
echo.
echo 💡 Для полной очистки (включая данные) используйте:
echo    docker-compose down -v --remove-orphans
pause