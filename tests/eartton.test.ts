import { Address, beginCell, Cell, toNano } from '@ton/core';
import { Blockchain, SandboxContract } from '@ton/sandbox';
import { compile } from '@ton/blueprint';
import { describe, expect, test } from '@jest/globals';

// Импорт классов контрактов
import { EarttonMaster, EarttonWallet, EarttonPool } from '../scripts/contracts'; // Предполагается, что классы будут вынесены в отдельный файл

describe('Eartton Token Tests', () => {
  let blockchain: Blockchain;
  let master: SandboxContract<EarttonMaster>;
  let wallet: SandboxContract<EarttonWallet>;
  let pool: SandboxContract<EarttonPool>;
  let owner: Address;
  let user: Address;

  beforeAll(async () => {
    // Компиляция контрактов
    const masterCode = await compile('contracts/master.fc');
    const walletCode = await compile('contracts/wallet.fc');
    const poolCode = await compile('contracts/pool.fc');

    // Создание блокчейна для тестирования
    blockchain = await Blockchain.create();
    owner = await blockchain.treasury('owner');
    user = await blockchain.treasury('user');

    // Создание контента токена
    const content = beginCell()
      .storeUint(1, 8) // off-chain marker
      .storeStringTail('https://example.com/eartton-metadata.json') // URL метаданных
      .endCell();

    // Создание пустого черного списка
    const blacklist = beginCell().endCell();

    // Создание и деплой мастер-контракта
    master = blockchain.openContract(
      EarttonMaster.createFromConfig(
        owner, // owner
        content, // content
        walletCode, // jetton_wallet_code
        100, // burn_rate (1%)
        1000, // staking_apr (10%)
        toNano('1000000'), // farming_pool_size (1,000,000 токенов)
        false, // paused
        blacklist, // blacklist
        masterCode, // code
      )
    );
    await master.sendDeploy(owner, toNano('0.05'));

    // Создание и деплой пула
    pool = blockchain.openContract(
      EarttonPool.createFromConfig(
        master.address, // master
        100, // reward_rate
        poolCode, // code
      )
    );
    await pool.sendDeploy(owner, toNano('0.05'));

    // Получение адреса кошелька пользователя
    const walletAddress = await master.getWalletAddress(user);
    wallet = blockchain.openContract(
      EarttonWallet.createFromAddress(walletAddress)
    );
  });

  test('Should mint tokens', async () => {
    // Минтинг токенов пользователю
    await master.sendMint(owner, {
      toAddress: user,
      amount: toNano('100'),
      value: toNano('0.05'),
    });

    // Проверка баланса
    const walletData = await wallet.getWalletData();
    expect(walletData.balance).toEqual(toNano('100'));
  });

  test('Should transfer tokens', async () => {
    // Создание адреса получателя
    const recipient = await blockchain.treasury('recipient');
    const recipientWalletAddress = await master.getWalletAddress(recipient);
    const recipientWallet = blockchain.openContract(
      EarttonWallet.createFromAddress(recipientWalletAddress)
    );

    // Перевод токенов
    await wallet.sendTransfer(user, {
      toAddress: recipient,
      amount: toNano('10'),
      value: toNano('0.05'),
    });

    // Проверка балансов
    const walletData = await wallet.getWalletData();
    const recipientWalletData = await recipientWallet.getWalletData();

    // Учитываем автоматическое сжигание (1%)
    const burnAmount = toNano('10') * BigInt(100) / BigInt(10000);
    const transferAmount = toNano('10') - burnAmount;

    expect(walletData.balance).toEqual(toNano('100') - toNano('10'));
    expect(recipientWalletData.balance).toEqual(transferAmount);
  });

  test('Should stake tokens', async () => {
    // Стейкинг токенов
    await wallet.sendStake(user, {
      amount: toNano('20'),
      duration: 86400, // 1 день
      value: toNano('0.05'),
    });

    // Проверка стейкинга
    const stakingData = await wallet.getStakingData();
    expect(stakingData.lockedBalance).toEqual(toNano('20'));
  });

  test('Should deposit to farming pool', async () => {
    // Внесение токенов в пул фарминга
    await wallet.sendDeposit(user, {
      amount: toNano('30'),
      value: toNano('0.05'),
    });

    // Проверка депозита
    const userData = await pool.getUserData(user);
    expect(userData.deposited).toEqual(toNano('30'));
  });

  test('Should blacklist user', async () => {
    // Добавление пользователя в черный список
    await master.sendAddToBlacklist(owner, {
      address: user,
      value: toNano('0.05'),
    });

    // Проверка черного списка
    const isBlacklisted = await master.isAddressBlacklisted(user);
    expect(isBlacklisted).toBe(true);

    // Попытка перевода токенов должна завершиться неудачей
    await expect(
      wallet.sendTransfer(user, {
        toAddress: await blockchain.treasury('another'),
        amount: toNano('5'),
        value: toNano('0.05'),
      })
    ).rejects.toThrow();
  });

  test('Should pause token operations', async () => {
    // Пауза операций с токеном
    await master.sendPause(owner, {
      value: toNano('0.05'),
    });

    // Проверка паузы
    const params = await master.getEarttonParams();
    expect(params.paused).toBe(true);

    // Попытка перевода токенов должна завершиться неудачей
    await expect(
      wallet.sendTransfer(user, {
        toAddress: await blockchain.treasury('another'),
        amount: toNano('5'),
        value: toNano('0.05'),
      })
    ).rejects.toThrow();
  });
}); 