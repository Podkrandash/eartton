# Документация по стандарту токенов Eartton v2.0

## Введение

Eartton — это инновационный стандарт токенов для The Open Network (TON), предоставляющий расширенные механизмы для DeFi, включая ликвидный стейкинг, динамическое сжигание, AMM и децентрализованное управление.

## Архитектура

Стандарт Eartton состоит из четырех основных контрактов:

1. **Master Contract** (`master.fc`) — управляет токеном и глобальными параметрами
2. **Staking Contract** (`staking.fc`) — управляет ликвидным стейкингом
3. **Pool Contract** (`pool.fc`) — управляет AMM и ликвидностью
4. **Wallet Contract** (`wallet.fc`) — пользовательский кошелек

## Инновационные механизмы

### 1. Динамическая токеномика

#### Автоматическая корректировка параметров
```typescript
// Пример получения динамических параметров
const params = await master.getDynamicParams();
console.log(`Current Burn Rate: ${params.burnRate / 100}%`);
console.log(`Current Staking APR: ${params.stakingApr / 100}%`);
```

#### Ликвидный стейкинг
```typescript
// Стейкинг с получением stEartton
const stake = await staking.stake({
    amount: toNano('1000'),
    lockPeriod: 30 * 24 * 3600, // 30 дней
});

// Использование stEartton в DeFi
const lpTokens = await pool.addLiquidity({
    tokenAmount: toNano('500'),
    stTokenAmount: toNano('500'),
});
```

### 2. Децентрализованное управление

#### Система голосования
```typescript
// Создание предложения
const proposal = await governance.createProposal({
    paramId: 1, // ID параметра для изменения
    newValue: 1500, // Новое значение (15% APR)
    description: "Увеличение APR стейкинга"
});

// Голосование
await governance.castVote({
    proposalId: proposal.id,
    support: true
});
```

#### Многоуровневый доступ
```typescript
// Проверка уровня доступа
const accessLevel = await master.checkAccessLevel(address);
// 3 - владелец
// 2 - администратор
// 1 - модератор
// 0 - пользователь
```

### 3. DeFi функциональность

#### Автоматический маркет-мейкинг (AMM)
```typescript
// Своп токенов
const swap = await pool.swap({
    amountIn: toNano('100'),
    minAmountOut: toNano('95'),
    tokenIn: "EARTTON",
    tokenOut: "TON"
});

// Добавление ликвидности
const addLiquidity = await pool.addLiquidity({
    tokenAAmount: toNano('1000'),
    tokenBAmount: toNano('1000'),
    minLPTokens: toNano('990')
});
```

#### Динамические комиссии
```typescript
// Получение текущей комиссии
const fee = await pool.getFee();
console.log(`Current Fee: ${fee / 100}%`);
```

### 4. Защита от инфляции

#### Динамическое сжигание
```typescript
// Получение статистики сжигания
const burnStats = await master.getBurnStats();
console.log(`Total Burned: ${burnStats.totalBurned}`);
console.log(`Current Burn Rate: ${burnStats.currentRate / 100}%`);
```

#### Автоматическая ребалансировка
```typescript
// Проверка последней ребалансировки
const rebalance = await master.getLastRebalance();
console.log(`Last Rebalance: ${new Date(rebalance.timestamp * 1000)}`);
console.log(`New Parameters: `, rebalance.params);
```

## Параметры и константы

### Базовые параметры
- `DECIMALS = 9`
- `MIN_TRANSFER = 1000` (0.000001 TON)
- `GAS_CONSUMPTION = 10000000` (0.01 TON)

### Параметры стейкинга
- `MIN_STAKE_PERIOD = 30 * 24 * 3600` (30 дней)
- `MAX_STAKE_PERIOD = 365 * 24 * 3600` (1 год)
- `MIN_STAKE_AMOUNT = 1000000000` (1 токен)
- `MAX_APR_BOOST = 100` (+100% к базовому APR)

### Параметры AMM
- `MIN_LIQUIDITY = 1000000`
- `DEFAULT_FEE = 30` (0.3%)
- `MIN_FEE = 1` (0.01%)
- `MAX_FEE = 100` (1%)
- `PRICE_IMPACT_LIMIT = 1000` (10%)

### Параметры безопасности
- `TRANSACTION_LIMIT = 1000000000000` (1000 токенов в час)
- `BLACKLIST_EXPIRE = 30 * 24 * 3600` (30 дней)
- `MAX_FAILED_ATTEMPTS = 3`

## Интеграция с TON Services

### TON DNS
```typescript
// Привязка токена к домену
await master.setDnsRecord({
    domain: "token.ton",
    category: "wallet"
});
```

### TON Storage
```typescript
// Сохранение метаданных
await master.updateMetadata({
    content: {
        name: "Eartton Token",
        description: "Advanced TON token standard",
        image: "ton://storage/..."
    }
});
```

## События и аналитика

### Эмиссия событий
```typescript
// Подписка на события
const events = await master.getEvents({
    fromTimestamp: Date.now() - 86400000, // За последние 24 часа
    types: ["swap", "stake", "governance"]
});
```

### Статистика использования
```typescript
// Получение статистики
const stats = await master.getStats();
console.log("Daily Volume:", stats.dailyVolume);
console.log("Total Users:", stats.totalUsers);
console.log("TVL:", stats.tvl);
```

## Безопасность

### Рекомендации по безопасности
1. Проведите аудит смарт-контрактов
2. Используйте мультисиг для управления
3. Установите разумные лимиты транзакций
4. Регулярно мониторьте активность

### Защита от атак
- Защита от фронт-раннинга
- Предотвращение атак повторного входа
- Защита от манипуляций ценой
- Временные замки для крупных транзакций

## Развертывание

### Локальное тестирование
```bash
# Установка зависимостей
npm install

# Компиляция контрактов
npm run build

# Запуск тестов
npm run test
```

### Деплой в тестнет
```bash
# Настройка конфигурации
cp .env.example .env
# Заполните .env необходимыми значениями

# Деплой контрактов
npm run deploy:testnet
```

### Деплой в мейннет
```bash
# Проверка безопасности
npm run audit

# Деплой контрактов
npm run deploy:mainnet
```

## Примеры использования

### DeFi токен с ликвидным стейкингом
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

### Governance токен
```typescript
const govToken = await EarttonMaster.deploy({
    initialSupply: toNano('10000000'),
    governanceParams: {
        votingPeriod: 7 * 24 * 3600,
        quorum: 100,
        superMajority: 66
    }
});
```

## Обновления и миграция

### Обновление контрактов
```typescript
// Проверка текущей версии
const version = await master.getVersion();

// Обновление контракта через прокси
await master.upgrade({
    newCode: newMasterCode,
    newParams: updatedParams
});
```

### Миграция данных
```typescript
// Экспорт данных
const data = await master.exportData();

// Импорт в новый контракт
await newMaster.importData(data);
```

## Поддержка и развитие

### Сообщество
- Telegram: [@EarttonDev](https://t.me/EarttonDev)
- GitHub: [github.com/eartton](https://github.com/eartton)

### Вклад в развитие
- Создавайте issue на GitHub
- Предлагайте улучшения через PR
- Участвуйте в обсуждениях на форуме

## Лицензия

MIT License 