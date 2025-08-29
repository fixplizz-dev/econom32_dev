@echo off
echo 🔄 Полная очистка и пересоздание окружения...

REM Остановка и удаление всех контейнеров
docker-compose down -v --remove-orphans

REM Удаление образов (опционально)
set /p choice="Удалить также Docker образы? (y/N): "
if /i "%choice%"=="y" (
    docker-compose down --rmi all
)

REM Очистка локальных данных
echo 🗑️ Очистка локальных данных...
if exist data rmdir /s /q data

echo 📁 Пересоздание структуры папок...
mkdir data
mkdir data\postgres
mkdir data\redis
mkdir data\minio
mkdir data\clamav
mkdir data\prometheus
mkdir data\grafana

echo ✅ Окружение очищено.
echo.
echo 🚀 Для повторной настройки запустите: scripts\dev-setup.bat
echo.
pause