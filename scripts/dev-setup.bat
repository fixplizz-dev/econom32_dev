@echo off
echo 🚀 Настройка локального окружения для модернизации econom32.ru

REM Проверка наличия Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker не установлен. Установите Docker Desktop.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose не установлен.
    pause
    exit /b 1
)

REM Создание .env файла если его нет
if not exist .env (
    echo 📝 Создание .env файла...
    copy .env.example .env
    echo ✅ Файл .env создан. Отредактируйте его при необходимости.
)

REM Создание необходимых директорий
echo 📁 Создание директорий...
if not exist docker\ssl mkdir docker\ssl
if not exist docker\nginx\logs mkdir docker\nginx\logs
if not exist data\postgres mkdir data\postgres
if not exist data\minio mkdir data\minio
if not exist data\redis mkdir data\redis

REM Запуск сервисов
echo 🐳 Запуск Docker сервисов...
docker-compose up -d

REM Ожидание запуска PostgreSQL
echo ⏳ Ожидание запуска PostgreSQL...
timeout /t 10 /nobreak >nul

REM Проверка статуса сервисов
echo 📊 Проверка статуса сервисов...
docker-compose ps

echo.
echo 🎉 Локальное окружение готово!
echo.
echo 📋 Доступные сервисы:
echo    • PostgreSQL: localhost:5432
echo    • Redis: localhost:6379
echo    • MinIO: http://localhost:9001 (admin: econom32_minio / econom32_minio_password)
echo    • Adminer: http://localhost:8080
echo    • Prometheus: http://localhost:9090
echo    • Grafana: http://localhost:3000 (admin / admin123)
echo    • Nginx: http://localhost:80
echo.
echo 🔧 Следующие шаги:
echo    1. Настройте подключение к старой MySQL базе в .env
echo    2. Запустите миграцию данных: npm run migrate
echo    3. Запустите приложение: npm run dev
echo.
pause