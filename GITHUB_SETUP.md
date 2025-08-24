# Инструкция по настройке Git и GitHub

## 🔧 Настройка для работы с GitHub

### 1. Аутентификация в GitHub

Выберите один из способов:

#### Способ 1: Personal Access Token (рекомендуется)

1. Перейдите в GitHub: Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Создайте новый токен с правами `repo`, `read:user`
3. Используйте токен как пароль при push:

   ```bash
   git push -u origin main
   # Username: ваш_github_username
   # Password: ваш_personal_access_token
   ```

#### Способ 2: GitHub CLI (альтернатива)

```bash
# Установите GitHub CLI
winget install GitHub.cli

# Аутентификация
gh auth login

# Клонирование через gh
gh repo clone fixplizz-dev/econom32_dev
```

### 2. Настройка SSH ключей (опционально)

```bash
# Генерация SSH ключа
ssh-keygen -t ed25519 -C "your_email@example.com"

# Добавление в GitHub: Settings → SSH and GPG keys
```

## 📋 Следующие шаги после настройки аутентификации

1. **Отправка кода в репозиторий:**

   ```bash
   git push -u origin main
   git push --tags  # отправка тегов версий
   ```

2. **Создание ветки для разработки:**

   ```bash
   git checkout -b develop
   git push -u origin develop
   ```

3. **Начало разработки Next.js приложения:**

   ```bash
   # В корне проекта
   npx create-next-app@latest frontend --typescript --tailwind --app
   git add .
   git commit -m "feat: создание Next.js приложения (v0.2)"
   git tag v0.2
   git push origin develop --tags
   ```

## 🚀 Статус проекта

- ✅ **v0.1**: Инициализация проекта и инфраструктуры
- 🔄 **v0.2**: Создание Next.js приложения (следующий шаг)
- 📋 **v0.3**: Настройка Prisma и PostgreSQL схемы
- 📋 **v0.4**: Система аутентификации
- 📋 **v0.5**: API для управления контентом

## 🔗 Ссылки

- **GitHub репозиторий**: <https://github.com/fixplizz-dev/econom32_dev>
- **Старый сайт**: <https://econom32.ru> (для анализа функций)
- **Спецификации**: `docs/specs/` (локально)