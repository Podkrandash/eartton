import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, toNano } from '@ton/core';
import { TonClient, WalletContractV4 } from '@ton/ton';
import fs from 'fs';
import path from 'path';

// Загрузка бинарных файлов контрактов
function loadContractCode(name: string): Cell {
  const buffer = fs.readFileSync(path.resolve(__dirname, `../build/${name}.cell`));
  return Cell.fromBoc(buffer)[0];
}

// Класс для мастер-контракта Eartton
class EarttonMaster implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell },
  ) {}

  static createFromConfig(
    owner: Address,
    content: Cell,
    jettonWalletCode: Cell,
    burnRate: number,
    stakingApr: number,
    farmingPoolSize: bigint,
    paused: boolean,
    blacklist: Cell,
    code: Cell,
  ) {
    const data = beginCell()
      .storeCoins(0) // total_supply
      .storeAddress(owner) // owner_address
      .storeRef(content) // content
      .storeRef(jettonWalletCode) // jetton_wallet_code
      .storeUint(burnRate, 16) // burn_rate
      .storeUint(stakingApr, 16) // staking_apr
      .storeCoins(farmingPoolSize) // farming_pool_size
      .storeUint(paused ? 1 : 0, 1) // paused
      .storeRef(blacklist) // blacklist
      .endCell();

    const init = { code, data };
    const address = contractAddress(0, init);
    return new EarttonMaster(address, init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  async sendMint(
    provider: ContractProvider,
    via: Sender,
    opts: {
      toAddress: Address;
      amount: bigint;
      queryId?: number;
      value: bigint;
    },
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(0x1674b0a0, 32) // op::mint
        .storeUint(opts.queryId || 0, 64) // query_id
        .storeAddress(opts.toAddress) // to_address
        .storeCoins(opts.amount) // amount
        .storeRef(beginCell().endCell()) // master_msg
        .endCell(),
    });
  }
}

// Класс для кошелька Eartton
class EarttonWallet implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell },
  ) {}

  static createFromConfig(
    owner: Address,
    master: Address,
    code: Cell,
  ) {
    const data = beginCell()
      .storeCoins(0) // balance
      .storeAddress(owner) // owner_address
      .storeAddress(master) // master_address
      .storeCoins(0) // locked_balance
      .storeUint(0, 32) // unlock_time
      .endCell();

    const init = { code, data };
    const address = contractAddress(0, init);
    return new EarttonWallet(address, init);
  }

  async sendTransfer(
    provider: ContractProvider,
    via: Sender,
    opts: {
      toAddress: Address;
      amount: bigint;
      queryId?: number;
      value: bigint;
    },
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(0x0f8a7ea5, 32) // op::transfer
        .storeUint(opts.queryId || 0, 64) // query_id
        .storeCoins(opts.amount) // amount
        .storeAddress(opts.toAddress) // to_address
        .storeAddress(via.address) // response_destination
        .storeCoins(toNano('0.01')) // forward_ton_amount
        .storeUint(0, 1) // forward_payload
        .endCell(),
    });
  }
}

// Класс для пула Eartton
class EarttonPool implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell },
  ) {}

  static createFromConfig(
    master: Address,
    rewardRate: number,
    code: Cell,
  ) {
    const data = beginCell()
      .storeCoins(0) // total_deposited
      .storeUint(rewardRate, 32) // reward_rate
      .storeAddress(master) // master_address
      .storeRef(beginCell().endCell()) // users (empty dictionary)
      .endCell();

    const init = { code, data };
    const address = contractAddress(0, init);
    return new EarttonPool(address, init);
  }
  
  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }
}

// Основная функция деплоя
async function deploy() {
  // Инициализация клиента TON
  const client = new TonClient({
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    apiKey: 'YOUR_API_KEY', // Замените на свой API ключ
  });

  // Загрузка кода контрактов
  const masterCode = loadContractCode('master');
  const walletCode = loadContractCode('wallet');
  const poolCode = loadContractCode('pool');

  // Инициализация кошелька для деплоя
  const mnemonic = 'YOUR_MNEMONIC'; // Замените на свою мнемоническую фразу
  const key = await WalletContractV4.getKeyFromMnemonic(mnemonic.split(' '));
  const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
  const sender = wallet.sender(client.open(wallet));

  // Создание контента токена
  const content = beginCell()
    .storeUint(1, 8) // off-chain marker
    .storeStringTail('https://example.com/eartton-metadata.json') // URL метаданных
    .endCell();

  // Создание пустого черного списка
  const blacklist = beginCell().endCell();

  // Создание мастер-контракта
  const master = EarttonMaster.createFromConfig(
    wallet.address, // owner
    content, // content
    walletCode, // jetton_wallet_code
    100, // burn_rate (1%)
    1000, // staking_apr (10%)
    toNano('1000000'), // farming_pool_size (1,000,000 токенов)
    false, // paused
    blacklist, // blacklist
    masterCode, // code
  );

  // Деплой мастер-контракта
  console.log(`Deploying Eartton Master to ${master.address.toString()}`);
  await master.sendDeploy(client.open(master), sender, toNano('0.05'));
  console.log('Eartton Master deployed');

  // Создание и деплой пула
  const pool = EarttonPool.createFromConfig(
    master.address, // master
    100, // reward_rate
    poolCode, // code
  );

  console.log(`Deploying Eartton Pool to ${pool.address.toString()}`);
  await pool.sendDeploy(client.open(pool), sender, toNano('0.05'));
  console.log('Eartton Pool deployed');

  // Минтинг токенов
  console.log('Minting tokens to the owner');
  await master.sendMint(client.open(master), sender, {
    toAddress: wallet.address,
    amount: toNano('1000'), // 1,000 токенов
    value: toNano('0.05'),
  });
  console.log('Tokens minted');
}

deploy().catch(console.error); 