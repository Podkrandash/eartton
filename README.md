tab# Eartton Token Standard

<p align="center">
  <img src="docs/assets/eartton-logo.png" alt="Eartton Logo" width="200"/>
</p>

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TON](https://img.shields.io/badge/TON-Compatible-blue)](https://ton.org/)
[![Tests](https://img.shields.io/badge/Tests-Passing-green)]()

</div>

## 📝 Описание

Eartton — это инновационный стандарт токенов для The Open Network (TON), предоставляющий расширенные механизмы для DeFi. Стандарт включает в себя ликвидный стейкинг, динамическое сжигание токенов, автоматический маркет-мейкинг (AMM) и децентрализованное управление.

esc## 🌟 Особенности

- **Динамическая токеномика**
  - Автоматическая корректировка параметров
  - Ликвидный стейкинг с получением stEartton
  - Защита от инфляции через динамическое сжигание

- **Децентрализованное управление**
  - Система голосования для изменения параметров
  - Многоуровневый доступ к функциям
  - Прозрачный процесс принятия решений

- **DeFi функциональность**
  - Встроенный AMM для мгновенных свопов
  - Пулы ликвидности с динамическими комиссиями
  - Интеграция с другими DeFi протоколами

- **Безопасность**
  - Защита от фронт-раннинга
  - Предотвращение атак повторного входа
  - Временные замки для крупных транзакций
  - Мультисиг управление

tab## 🛠 Технологии

- FunC для смарт-контрактов
- TypeScript для тестов и деплоя
- TON SDK для взаимодействия с блокчейном

## 📦 Установка

```bash
# Клонирование репозитория
git clone https://github.com/Podkrandash/eartton.git
cd eartton

# Установка зависимостей
npm install

# Компиляция контрактов
npm run build

# Запуск тестов
npm run test
```

## 🚀 Быстрый старт

### Деплой токена

```typescript
const defiToken = await EarttonMaster.deploy({
    initialSupply: toNano('1000000'),
    stakingParams: {
        minLockPeriod: 30 * 24 * 3600,
        baseApr: 1000, // 10%
        boostMultiplier: 200 // До 20%
    },
    ammParams: {
        initialFee: 30, // 0.3%
        feeRecipient: treasury
    }
});
```

### Стейкинг токенов

```typescript
// Стейкинг с получением stEartton
const stake = await staking.stake({
    amount: toNano('1000'),
    lockPeriod: 30 * 24 * 3600 // 30 дней
});
```

### Использование AMM

```typescript
// Своп токенов
const swap = await pool.swap({
    amountIn: toNano('100'),
    minAmountOut: toNano('95'),
    tokenIn: "EARTTON",
    tokenOut: "TON"
});
```

## 📖 Документация

Подробная документация доступна в [DOCUMENTATION.md](DOCUMENTATION.md)

## 🔧 Разработка

### Структура проекта

```
eartton-standard/
├── contracts/           # Смарт-контракты
│   ├── master.fc       # Основной контракт
│   ├── staking.fc      # Контракт стейкинга
│   ├── pool.fc         # Контракт пула ликвидности
│   └── wallet.fc       # Контракт кошелька
├── tests/              # Тесты
├── scripts/            # Скрипты деплоя
└── docs/               # Документация
```

### Запуск в тестовой сети

```bash
# Настройка конфигурации
cp .env.example .env
# Заполните .env необходимыми значениями

# Деплой в тестнет
npm run deploy:testnet
```

## 🤝 Вклад в развитие

Мы приветствуем вклад в развитие проекта! Пожалуйста, ознакомьтесь с [CONTRIBUTING.md](CONTRIBUTING.md) для получения информации о том, как внести свой вклад.

## 📄 Лицензия

Проект распространяется под лицензией MIT. Подробности в файле [LICENSE](LICENSE).

## 🌐 Сообщество

- Telegram: [@EarttonDev](https://t.me/EarttonDev)
- GitHub: [github.com/Podkrandash/eartton](https://github.com/Podkrandash/eartton)
- Форум: [forum.ton.org/eartton](https://forum.ton.org/eartton)

## ⚠️ Дисклеймер

Это экспериментальный проект. Используйте на свой страх и риск. Авторы не несут ответственности за возможные потери. 
