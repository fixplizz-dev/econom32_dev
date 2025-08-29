# Инструкция по развертыванию проекта econom32_v1

## Описание проекта
Современный веб-сайт Департамента экономического развития Брянской области с административной панелью, системой управления контентом и мониторингом.

## Требования к системе
- **Docker** и **Docker Compose** (последние версии)
- **Node.js** 18+ и **npm**
- **Git** (для управления версиями)
- **Минимум 4GB RAM** и **10GB свободного места**

## Архитектура проекта
- **Frontend**: Next.js 15 (TypeScript, Tailwind CSS)
- **Backend**: Node.js + Express + Prisma ORM
- **База данных**: PostgreSQL 15
- **Кэширование**: Redis
- **Файловое хранилище**: MinIO (S3-compatible)
- **Мониторинг**: Prometheus + Grafana
- **Безопасность**: Nginx, Fail2Ban, ClamAV

## Пошаговое развертывание

### 1. Подготовка окружения
```bash
# Распакуйте архив в рабочую папку
cd /path/to/project

# Создайте файл окружения
cp .env.example .env

# Отредактируйте .env файл под ваши нужды
nano .env
```

### 2. Настройка переменных окружения (.env)
```env
# Database
DATABASE_URL="postgresql://econom32_user:econom32_password@localhost:5432/econom32_new"

# Redis
REDIS_URL="redis://localhost:6379"

# MinIO
MINIO_ENDPOINT="localhost:9000"
MINIO_ACCESS_KEY="econom32_minio"
MINIO_SECRET_KEY="econom32_minio_password"

# Application
NODE_ENV="development"
API_PORT=3002
PORT=3001

# Security (измените в продакшене!)
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
```

### 3. Запуск инфраструктуры
```bash
# Запуск Docker сервисов
make setup
# или
docker-compose up -d

# Ожидание запуска PostgreSQL (30 секунд)
sleep 30
```

### 4. Восстановление базы данных
```bash
# Восстановление из бэкапа
docker-compose exec postgres psql -U econom32_user -d econom32_new < backup_database.sql

# Или создание новой базы с тестовыми данными
cd backend
npx prisma db push
npx prisma db seed
```

### 5. Установка зависимостей
```bash
# Установка всех зависимостей
npm run install:all

# Или по отдельности
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 6. Запуск приложения
```bash
# Запуск в режиме разработки
npm run dev

# Или запуск отдельно
npm run dev:frontend  # Frontend на порту 3001
npm run dev:backend   # Backend на порту 3002
```

## Доступные сервисы

| Сервис | URL | Описание |
|--------|-----|----------|
| **Frontend** | http://localhost:3001 | Основной сайт |
| **Backend API** | http://localhost:3002 | REST API |
| **Admin Panel** | http://localhost:3001/admin | Административная панель |
| **PostgreSQL** | localhost:5432 | База данных |
| **Redis** | localhost:6379 | Кэш |
| **MinIO Console** | http://localhost:9001 | Файловое хранилище |
| **Grafana** | http://localhost:3000 | Мониторинг (admin/admin123) |
| **Prometheus** | http://localhost:9090 | Метрики |
| **Adminer** | http://localhost:8080 | Управление БД |

## Управление проектом

### Полезные команды
```bash
# Просмотр логов
make logs
docker-compose logs -f

# Остановка сервисов
make stop
docker-compose down

# Перезапуск
make restart

# Резервное копирование
make backup

# Подключение к базе данных
make db-shell

# Подключение к Redis
make redis-cli
```

### Структура проекта
```
econom32_v1/
├── frontend/          # Next.js приложение
├── backend/           # Express API сервер
├── docker/            # Docker конфигурации
├── scripts/           # Скрипты автоматизации
├── data/              # Данные сервисов
├── .kiro/             # Конфигурация разработки
└── docker-compose.yml # Оркестрация сервисов
```

## Безопасность

### Важные настройки для продакшена:
1. **Измените пароли** в .env файле
2. **Настройте SSL** сертификаты в docker/ssl/
3. **Обновите секретные ключи** (NEXTAUTH_SECRET)
4. **Настройте Fail2Ban** для защиты от атак
5. **Включите ClamAV** для проверки файлов

### Мониторинг безопасности:
```bash
# Запуск скрипта мониторинга
./scripts/security-monitor.sh

# Генерация отчета безопасности
./scripts/security-report.sh
```

## Устранение неполадок

### Проблемы с базой данных:
```bash
# Проверка подключения
docker-compose exec postgres psql -U econom32_user -d econom32_new -c "SELECT version();"

# Пересоздание схемы
cd backend
npx prisma db push --force-reset
```

### Проблемы с портами:
```bash
# Проверка занятых портов
netstat -tulpn | grep :3001
netstat -tulpn | grep :3002

# Остановка процессов
sudo kill -9 $(lsof -t -i:3001)
```

### Очистка Docker:
```bash
# Полная очистка
docker-compose down -v
docker system prune -a
```

## Разработка

### Добавление новых функций:
1. Создайте ветку: `git checkout -b feature/new-feature`
2. Внесите изменения
3. Протестируйте: `npm test`
4. Создайте коммит: `git commit -m "Add new feature"`

### Обновление зависимостей:
```bash
# Обновление Docker образов
make update

# Обновление npm пакетов
npm update
cd frontend && npm update
cd ../backend && npm update
```

## Поддержка
Для получения помощи обратитесь к документации в папке `.kiro/specs/` или создайте issue в репозитории проекта.

---
**Дата создания**: 26 августа 2025
**Версия**: 1.0.0
**Статус**: Готов к развертыванию