import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountType, DepositoryAccountSubtype } from 'splice-api';
import { Repository } from 'typeorm';
import { AccountEntity } from '../../../src/accounts/account.entity';
import { AccountService } from '../../../src/accounts/account.service';
import { CreateAccountDto } from '../../../src/accounts/dto/create-account.dto';
import { UpdateAccountDto } from '../../../src/accounts/dto/update-account.dto';
import { MOCK_USER_ID } from '../../mocks/mocks';

describe('AccountService', () => {
  let service: AccountService;
  let repository: jest.Mocked<Repository<AccountEntity>>;

  const mockAccount: AccountEntity = {
    id: 'account-1',
    bankConnectionId: 'bank-connection-1',
    providerAccountId: 'provider-account-1',
    name: 'Test Account',
    balances: {
      current: 1000,
      available: 900,
      isoCurrencyCode: 'USD',
    },
    mask: '1234',
    type: {
      type: AccountType.DEPOSITORY,
      subtype: DepositoryAccountSubtype.CHECKING,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    bankConnection: {
      userId: MOCK_USER_ID,
    } as any,
    transactions: [],
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: getRepositoryToken(AccountEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
    repository = module.get(getRepositoryToken(AccountEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUserId', () => {
    it('should return accounts for a user', async () => {
      const mockAccounts = [mockAccount];
      repository.find.mockResolvedValue(mockAccounts);

      const result = await service.findByUserId(MOCK_USER_ID);

      expect(repository.find).toHaveBeenCalledWith({
        where: { bankConnection: { userId: MOCK_USER_ID } },
        relations: ['bankConnection'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockAccounts);
    });

    it('should return empty array when no accounts found', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findByUserId(MOCK_USER_ID);

      expect(result).toEqual([]);
    });
  });

  describe('findByUserIdAndAccountId', () => {
    it('should return account when found', async () => {
      repository.findOne.mockResolvedValue(mockAccount);

      const result = await service.findByUserIdAndAccountId(MOCK_USER_ID, 'account-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: 'account-1',
          bankConnection: { userId: MOCK_USER_ID },
        },
        relations: ['bankConnection'],
      });
      expect(result).toEqual(mockAccount);
    });

    it('should return null when account not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByUserIdAndAccountId(MOCK_USER_ID, 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserIdAndAccountIdOrThrow', () => {
    it('should return account when found', async () => {
      repository.findOne.mockResolvedValue(mockAccount);

      const result = await service.findByUserIdAndAccountIdOrThrow(MOCK_USER_ID, 'account-1');

      expect(result).toEqual(mockAccount);
    });

    it('should throw NotFoundException when account not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findByUserIdAndAccountIdOrThrow(MOCK_USER_ID, 'non-existent')).rejects.toThrow(
        new NotFoundException('Account not found: non-existent'),
      );
    });
  });

  describe('create', () => {
    it('should create and save account', async () => {
      const createDto: CreateAccountDto = {
        bankConnectionId: 'bank-connection-1',
        providerAccountId: 'provider-account-1',
        name: 'Test Account',
        balances: {
          current: 1000,
          available: 900,
          isoCurrencyCode: 'USD',
        },
        mask: '1234',
        type: {
          type: AccountType.DEPOSITORY,
          subtype: DepositoryAccountSubtype.CHECKING,
        },
      };

      const createdAccount = { ...mockAccount };
      repository.create.mockReturnValue(createdAccount);
      repository.save.mockResolvedValue(createdAccount);

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith({
        bankConnectionId: createDto.bankConnectionId,
        providerAccountId: createDto.providerAccountId,
        name: createDto.name,
        balances: createDto.balances,
        mask: createDto.mask,
        type: createDto.type,
      });
      expect(repository.save).toHaveBeenCalledWith(createdAccount);
      expect(result).toEqual(createdAccount);
    });
  });

  describe('update', () => {
    it('should update and return account', async () => {
      const updateDto: UpdateAccountDto = {
        name: 'Updated Account',
        mask: '5678',
      };

      const updatedAccount = { ...mockAccount, ...updateDto };
      repository.update.mockResolvedValue({ affected: 1 } as any);
      repository.findOne.mockResolvedValue(updatedAccount);

      const result = await service.update('account-1', updateDto);

      expect(repository.update).toHaveBeenCalledWith('account-1', updateDto);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'account-1' },
        relations: ['bankConnection'],
      });
      expect(result).toEqual(updatedAccount);
    });

    it('should throw NotFoundException when account not found after update', async () => {
      const updateDto: UpdateAccountDto = { name: 'Updated Account' };
      repository.update.mockResolvedValue({ affected: 1 } as any);
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(
        new NotFoundException('Account not found: non-existent'),
      );
    });
  });

  describe('remove', () => {
    it('should delete account successfully', async () => {
      repository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.remove('account-1');

      expect(repository.delete).toHaveBeenCalledWith('account-1');
    });

    it('should throw NotFoundException when account not found', async () => {
      repository.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(service.remove('non-existent')).rejects.toThrow(
        new NotFoundException('Account not found: non-existent'),
      );
    });
  });

  describe('toResponse', () => {
    it('should convert entity to response format', () => {
      const response = service.toResponse(mockAccount);

      expect(response).toEqual({
        id: mockAccount.id,
        bankConnectionId: mockAccount.bankConnectionId,
        providerAccountId: mockAccount.providerAccountId,
        name: mockAccount.name,
        type: mockAccount.type,
        balances: mockAccount.balances,
        mask: mockAccount.mask,
        createdAt: mockAccount.createdAt,
        updatedAt: mockAccount.updatedAt,
      });
    });
  });
});
