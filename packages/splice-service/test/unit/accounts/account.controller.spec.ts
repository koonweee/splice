import { Test, TestingModule } from '@nestjs/testing';
import { AccountType, DepositoryAccountSubtype } from 'splice-api';
import { AccountController } from '../../../src/accounts/account.controller';
import { AccountEntity } from '../../../src/accounts/account.entity';
import { AccountService } from '../../../src/accounts/account.service';
import { AccountByIdParamsDto } from '../../../src/accounts/dto/account-params.dto';
import { CreateAccountDto } from '../../../src/accounts/dto/create-account.dto';
import { UpdateAccountDto } from '../../../src/accounts/dto/update-account.dto';
import { MOCK_USER, MOCK_USER_ID } from '../../mocks/mocks';

describe('AccountController', () => {
  let controller: AccountController;
  let service: jest.Mocked<AccountService>;

  const mockAccountEntity: AccountEntity = {
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

  const mockAccountResponse = {
    id: 'account-1',
    bankConnectionId: 'bank-connection-1',
    providerAccountId: 'provider-account-1',
    name: 'Test Account',
    type: {
      type: AccountType.DEPOSITORY,
      subtype: DepositoryAccountSubtype.CHECKING,
    },
    balances: {
      current: 1000,
      available: 900,
      isoCurrencyCode: 'USD',
    },
    mask: '1234',
    createdAt: mockAccountEntity.createdAt,
    updatedAt: mockAccountEntity.updatedAt,
  };

  beforeEach(async () => {
    const mockService = {
      findByUserId: jest.fn(),
      findByUserIdAndAccountIdOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      toResponse: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        {
          provide: AccountService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AccountController>(AccountController);
    service = module.get(AccountService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all accounts for a user', async () => {
      const mockAccounts = [mockAccountEntity];
      service.findByUserId.mockResolvedValue(mockAccounts);
      service.toResponse.mockReturnValue(mockAccountResponse);

      const result = await controller.findAll(MOCK_USER);

      expect(service.findByUserId).toHaveBeenCalledWith(MOCK_USER.id);
      expect(service.toResponse).toHaveBeenCalledWith(mockAccountEntity);
      expect(result).toEqual([mockAccountResponse]);
    });

    it('should return empty array when no accounts found', async () => {
      service.findByUserId.mockResolvedValue([]);

      const result = await controller.findAll(MOCK_USER);

      expect(service.findByUserId).toHaveBeenCalledWith(MOCK_USER.id);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return account by ID', async () => {
      const params: AccountByIdParamsDto = { accountId: 'account-1' };
      service.findByUserIdAndAccountIdOrThrow.mockResolvedValue(mockAccountEntity);
      service.toResponse.mockReturnValue(mockAccountResponse);

      const result = await controller.findOne(MOCK_USER, params);

      expect(service.findByUserIdAndAccountIdOrThrow).toHaveBeenCalledWith(MOCK_USER.id, 'account-1');
      expect(service.toResponse).toHaveBeenCalledWith(mockAccountEntity);
      expect(result).toEqual(mockAccountResponse);
    });
  });

  describe('create', () => {
    it('should create a new account', async () => {
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

      service.create.mockResolvedValue(mockAccountEntity);
      service.toResponse.mockReturnValue(mockAccountResponse);

      const result = await controller.create(MOCK_USER, createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(service.toResponse).toHaveBeenCalledWith(mockAccountEntity);
      expect(result).toEqual(mockAccountResponse);
    });
  });

  describe('update', () => {
    it('should update account by ID', async () => {
      const params: AccountByIdParamsDto = { accountId: 'account-1' };
      const updateDto: UpdateAccountDto = {
        name: 'Updated Account',
        mask: '5678',
      };

      const updatedEntity = { ...mockAccountEntity, ...updateDto };
      const updatedResponse = { ...mockAccountResponse, ...updateDto };

      service.findByUserIdAndAccountIdOrThrow.mockResolvedValue(mockAccountEntity);
      service.update.mockResolvedValue(updatedEntity);
      service.toResponse.mockReturnValue(updatedResponse);

      const result = await controller.update(MOCK_USER, params, updateDto);

      expect(service.findByUserIdAndAccountIdOrThrow).toHaveBeenCalledWith(MOCK_USER.id, 'account-1');
      expect(service.update).toHaveBeenCalledWith('account-1', updateDto);
      expect(service.toResponse).toHaveBeenCalledWith(updatedEntity);
      expect(result).toEqual(updatedResponse);
    });
  });

  describe('remove', () => {
    it('should delete account by ID', async () => {
      const params: AccountByIdParamsDto = { accountId: 'account-1' };

      service.findByUserIdAndAccountIdOrThrow.mockResolvedValue(mockAccountEntity);
      service.remove.mockResolvedValue();

      await controller.remove(MOCK_USER, params);

      expect(service.findByUserIdAndAccountIdOrThrow).toHaveBeenCalledWith(MOCK_USER.id, 'account-1');
      expect(service.remove).toHaveBeenCalledWith('account-1');
    });
  });
});
