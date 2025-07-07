import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountResponse } from 'splice-api';
import { Repository } from 'typeorm';
import { AccountEntity } from './account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    @InjectRepository(AccountEntity)
    private accountRepository: Repository<AccountEntity>,
  ) {}

  async findByUserId(userId: string): Promise<AccountEntity[]> {
    return this.accountRepository.find({
      where: {
        bankConnection: { userId },
      },
      relations: ['bankConnection'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserIdAndAccountId(userId: string, accountId: string): Promise<AccountEntity | null> {
    return this.accountRepository.findOne({
      where: {
        id: accountId,
        bankConnection: { userId },
      },
      relations: ['bankConnection'],
    });
  }

  async findByUserIdAndAccountIdOrThrow(userId: string, accountId: string): Promise<AccountEntity> {
    const account = await this.findByUserIdAndAccountId(userId, accountId);
    if (!account) {
      throw new NotFoundException(`Account not found: ${accountId}`);
    }
    return account;
  }

  async create(createAccountDto: CreateAccountDto): Promise<AccountEntity> {
    const account = this.accountRepository.create({
      bankConnectionId: createAccountDto.bankConnectionId,
      providerAccountId: createAccountDto.providerAccountId,
      name: createAccountDto.name,
      balances: createAccountDto.balances,
      mask: createAccountDto.mask,
      type: createAccountDto.type as any,
    });
    return this.accountRepository.save(account);
  }

  async update(accountId: string, updateAccountDto: UpdateAccountDto): Promise<AccountEntity> {
    await this.accountRepository.update(accountId, updateAccountDto);
    const updatedAccount = await this.accountRepository.findOne({
      where: { id: accountId },
      relations: ['bankConnection'],
    });

    if (!updatedAccount) {
      throw new NotFoundException(`Account not found: ${accountId}`);
    }

    return updatedAccount;
  }

  async remove(accountId: string): Promise<void> {
    const result = await this.accountRepository.delete(accountId);
    if (result.affected === 0) {
      throw new NotFoundException(`Account not found: ${accountId}`);
    }
  }

  toResponse(account: AccountEntity): AccountResponse {
    return {
      id: account.id,
      bankConnectionId: account.bankConnectionId,
      providerAccountId: account.providerAccountId,
      name: account.name,
      type: account.type,
      balances: account.balances,
      mask: account.mask,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
