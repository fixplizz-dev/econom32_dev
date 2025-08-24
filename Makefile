# Makefile для управления локальным окружением разработки

.PHONY: help setup start stop restart logs clean reset

# Показать справку
help:
	@echo "🚀 Команды для разработки econom32.ru"
	@echo ""
	@echo "  setup     - Первоначальная настройка окружения"
	@echo "  start     - Запуск всех сервисов"
	@echo "  stop      - Остановка всех сервисов"
	@echo "  restart   - Перезапуск всех сервисов"
	@echo "  logs      - Просмотр логов всех сервисов"
	@echo "  clean     - Остановка и удаление контейнеров"
	@echo "  reset     - Полная очистка окружения"
	@echo "  db-shell  - Подключение к PostgreSQL"
	@echo "  redis-cli - Подключение к Redis"
	@echo ""

# Первоначальная настройка
setup:
	@chmod +x scripts/*.sh
	@./scripts/dev-setup.sh

# Запуск сервисов
start:
	@echo "🚀 Запуск сервисов..."
	@docker-compose up -d
	@echo "✅ Сервисы запущены"

# Остановка сервисов
stop:
	@echo "🚫 Остановка сервисов..."
	@docker-compose down
	@echo "✅ Сервисы остановлены"

# Перезапуск сервисов
restart: stop start

# Просмотр логов
logs:
	@docker-compose logs -f

# Просмотр логов конкретного сервиса
logs-%:
	@docker-compose logs -f $*

# Остановка и удаление контейнеров
clean:
	@echo "🧹 Очистка контейнеров..."
	@docker-compose down --remove-orphans
	@echo "✅ Контейнеры удалены"

# Полная очистка
reset:
	@./scripts/dev-reset.sh

# Подключение к PostgreSQL
db-shell:
	@docker-compose exec postgres psql -U econom32_user -d econom32_new

# Подключение к Redis
redis-cli:
	@docker-compose exec redis redis-cli

# Статус сервисов
status:
	@docker-compose ps

# Обновление образов
update:
	@echo "🔄 Обновление Docker образов..."
	@docker-compose pull
	@echo "✅ Образы обновлены"

# Инициализация нового проекта
init-frontend:
	@echo "🚀 Создание Next.js проекта..."
	@npx create-next-app@latest frontend --typescript --tailwind --app --src-dir --import-alias "@/*"
	@echo "✅ Frontend проект создан"

init-backend:
	@echo "🚀 Создание Backend проекта..."
	@mkdir -p backend
	@cd backend && npm init -y
	@cd backend && npm install express prisma @prisma/client bcrypt jsonwebtoken cors helmet
	@cd backend && npm install -D @types/node @types/express typescript ts-node nodemon
	@echo "✅ Backend проект создан"

# Инициализация Prisma
init-prisma:
	@echo "🗄️ Инициализация Prisma..."
	@cd backend && npx prisma init
	@echo "✅ Prisma инициализирован. Настройте schema.prisma"

# Команды для миграции (будут использоваться позже)
migration-help:
	@echo "📊 Команды миграции (использовать после завершения разработки):"
	@echo "  Смотрите scripts/migration/README.md для подробностей"