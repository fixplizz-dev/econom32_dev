# Makefile для управления портативным окружением разработки

.PHONY: help setup start stop restart logs clean reset backup restore

# Показать справку
help:
	@echo "🚀 Команды для разработки econom32.ru (портативная версия)"
	@echo ""
	@echo "  setup     - Первоначальная настройка окружения"
	@echo "  start     - Запуск всех сервисов"
	@echo "  stop      - Остановка всех сервисов"
	@echo "  restart   - Перезапуск всех сервисов"
	@echo "  logs      - Просмотр логов всех сервисов"
	@echo "  clean     - Остановка и удаление контейнеров"
	@echo "  reset     - Полная очистка окружения"
	@echo "  backup    - Создание резервной копии данных"
	@echo "  restore   - Восстановление из резервной копии"
	@echo "  db-shell  - Подключение к PostgreSQL"
	@echo "  redis-cli - Подключение к Redis"
	@echo "  size      - Показать размер данных"
	@echo ""

# Первоначальная настройка
setup:
	@echo "📁 Создание папок для данных..."
	@mkdir -p data/{postgres,redis,minio,clamav,prometheus,grafana}
	@mkdir -p docker/{ssl,nginx/logs}
	@chmod +x scripts/*.sh
	@if [ -f scripts/dev-setup.sh ]; then ./scripts/dev-setup.sh; else echo "Запустите docker-compose up -d"; fi

# Запуск сервисов
start:
	@echo "🚀 Запуск сервисов..."
	@docker-compose up -d
	@echo "✅ Сервисы запущены"

# Остановка сервисов
stop:
	@echo "🛑 Остановка сервисов..."
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

# Создание резервной копии
backup:
	@echo "💾 Создание резервной копии данных..."
	@tar -czf backup-$(shell date +%Y%m%d-%H%M).tar.gz data/
	@echo "✅ Резервная копия создана: backup-$(shell date +%Y%m%d-%H%M).tar.gz"

# Восстановление из резервной копии
restore:
	@echo "⚠️  Восстановление удалит текущие данные!"
	@read -p "Введите имя файла бэкапа: " backup && \
	docker-compose down && \
	rm -rf data/* && \
	tar -xzf $$backup && \
	docker-compose up -d
	@echo "✅ Данные восстановлены"

# Показать размер данных
size:
	@echo "📊 Размер данных по сервисам:"
	@du -sh data/* 2>/dev/null || echo "Папка data пуста"
	@echo ""
	@echo "📊 Общий размер проекта:"
	@du -sh . --exclude=node_modules

# Обновление образов
update:
	@echo "🔄 Обновление Docker образов..."
	@docker-compose pull
	@echo "✅ Образы обновлены"