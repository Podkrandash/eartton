import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, toNano } from '@ton/core';

// Класс для мастер-контракта Eartton
export class EarttonMaster implements Contract {
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

  async sendPause(
    provider: ContractProvider,
    via: Sender,
    opts: {
      queryId?: number;
      value: bigint;
    },
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(0x56781234, 32) // op::pause
        .storeUint(opts.queryId || 0, 64) // query_id
        .endCell(),
    });
  }

  async sendUnpause(
    provider: ContractProvider,
    via: Sender,
    opts: {
      queryId?: number;
      value: bigint;
    },
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(0x43218765, 32) // op::unpause
        .storeUint(opts.queryId || 0, 64) // query_id
        .endCell(),
    });
  }

  async sendAddToBlacklist(
    provider: ContractProvider,
    via: Sender,
    opts: {
      address: Address;
      queryId?: number;
      value: bigint;
    },
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(0xaabbccdd, 32) // op::add_to_blacklist
        .storeUint(opts.queryId || 0, 64) // query_id
        .storeAddress(opts.address) // address
        .endCell(),
    });
  }

  async sendRemoveFromBlacklist(
    provider: ContractProvider,
    via: Sender,
    opts: {
      address: Address;
      queryId?: number;
      value: bigint;
    },
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(0xddccbbaa, 32) // op::remove_from_blacklist
        .storeUint(opts.queryId || 0, 64) // query_id
        .storeAddress(opts.address) // address
        .endCell(),
    });
  }

  async sendUpdateStakingApr(
    provider: ContractProvider,
    via: Sender,
    opts: {
      apr: number;
      queryId?: number;
      value: bigint;
    },
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(0x11112222, 32) // op::update_staking_apr
        .storeUint(opts.queryId || 0, 64) // query_id
        .storeUint(opts.apr, 16) // apr
        .endCell(),
    });
  }

  async sendUpdateBurnRate(
    provider: ContractProvider,
    via: Sender,
    opts: {
      burnRate: number;
      queryId?: number;
      value: bigint;
    },
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(0x22221111, 32) // op::update_burn_rate
        .storeUint(opts.queryId || 0, 64) // query_id
        .storeUint(opts.burnRate, 16) // burn_rate
        .endCell(),
    });
  }

  async getWalletAddress(provider: ContractProvider, owner: Address) {
    const result = await provider.get('get_wallet_address', [
      { type: 'slice', cell: beginCell().storeAddress(owner).endCell() },
    ]);
    return result.stack.readAddress();
  }

  async getEarttonParams(provider: ContractProvider) {
    const result = await provider.get('get_eartton_params', []);
    return {
      burnRate: result.stack.readNumber(),
      stakingApr: result.stack.readNumber(),
      farmingPoolSize: result.stack.readBigNumber(),
      paused: result.stack.readBoolean(),
    };
  }

  async isAddressBlacklisted(provider: ContractProvider, address: Address) {
    const result = await provider.get('is_address_blacklisted', [
      { type: 'slice', cell: beginCell().storeAddress(address).endCell() },
    ]);
    return result.stack.readBoolean();
  }
}

// Класс для кошелька Eartton
export class EarttonWallet implements Contract {
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

  static createFromAddress(address: Address) {
    return new EarttonWallet(address);
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

  async sendBurn(
    provider: ContractProvider,
    via: Sender,
    opts: {
      amount: bigint;
      queryId?: number;
      value: bigint;
    },
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(0x595f07bc, 32) // op::burn
        .storeUint(opts.queryId || 0, 64) // query_id
        .storeCoins(opts.amount) // amount
        .endCell(),
    });
  }

  async sendStake(
    provider: ContractProvider,
    via: Sender,
    opts: {
      amount: bigint;
      duration: number;
      queryId?: number;
      value: bigint;
    },
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(0x12345678, 32) // op::stake
        .storeUint(opts.queryId || 0, 64) // query_id
        .storeCoins(opts.amount) // amount
        .storeUint(opts.duration, 32) // duration
        .endCell(),
    });
  }

  async sendUnstake(
    provider: ContractProvider,
    via: Sender,
    opts: {
      queryId?: number;
      value: bigint;
    },
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(0x87654321, 32) // op::unstake
        .storeUint(opts.queryId || 0, 64) // query_id
        .endCell(),
    });
  }

  async sendDeposit(
    provider: ContractProvider,
    via: Sender,
    opts: {
      amount: bigint;
      queryId?: number;
      value: bigint;
    },
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(0xabcdef01, 32) // op::deposit
        .storeUint(opts.queryId || 0, 64) // query_id
        .storeCoins(opts.amount) // amount
        .endCell(),
    });
  }

  async sendWithdraw(
    provider: ContractProvider,
    via: Sender,
    opts: {
      amount: bigint;
      queryId?: number;
      value: bigint;
    },
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(0x10fedcba, 32) // op::withdraw
        .storeUint(opts.queryId || 0, 64) // query_id
        .storeCoins(opts.amount) // amount
        .endCell(),
    });
  }

  async sendClaim(
    provider: ContractProvider,
    via: Sender,
    opts: {
      queryId?: number;
      value: bigint;
    },
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(0x98765432, 32) // op::claim
        .storeUint(opts.queryId || 0, 64) // query_id
        .endCell(),
    });
  }

  async getWalletData(provider: ContractProvider) {
    const result = await provider.get('get_wallet_data', []);
    return {
      balance: result.stack.readBigNumber(),
      owner: result.stack.readAddress(),
      master: result.stack.readAddress(),
      lockedBalance: result.stack.readBigNumber(),
    };
  }

  async getStakingData(provider: ContractProvider) {
    const result = await provider.get('get_staking_data', []);
    return {
      lockedBalance: result.stack.readBigNumber(),
      unlockTime: result.stack.readNumber(),
    };
  }
}

// Класс для пула Eartton
export class EarttonPool implements Contract {
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

  async sendUpdateRewardRate(
    provider: ContractProvider,
    via: Sender,
    opts: {
      rewardRate: number;
      queryId?: number;
      value: bigint;
    },
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(0x33334444, 32) // op::update_reward_rate
        .storeUint(opts.queryId || 0, 64) // query_id
        .storeUint(opts.rewardRate, 32) // reward_rate
        .endCell(),
    });
  }

  async getPoolData(provider: ContractProvider) {
    const result = await provider.get('get_pool_data', []);
    return {
      totalDeposited: result.stack.readBigNumber(),
      rewardRate: result.stack.readNumber(),
    };
  }

  async getUserData(provider: ContractProvider, user: Address) {
    const result = await provider.get('get_user_data', [
      { type: 'slice', cell: beginCell().storeAddress(user).endCell() },
    ]);
    return {
      deposited: result.stack.readBigNumber(),
      lastClaimTime: result.stack.readNumber(),
      rewards: result.stack.readBigNumber(),
    };
  }
} 