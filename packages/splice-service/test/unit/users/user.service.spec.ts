import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'splice-api';
import type { Repository } from 'typeorm';
import { AuthService } from '../../../src/auth/auth.service';
import { UserEntity } from '../../../src/users/user.entity';
import { UserService } from '../../../src/users/user.service';

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<Repository<UserEntity>>;
  let authService: jest.Mocked<AuthService>;

  const mockUser: User = {
    id: 'test-id',
    username: 'testuser',
    email: 'test@example.com',
    tokenVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
      increment: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const mockAuthService = {
      generateApiKey: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(getRepositoryToken(UserEntity));
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create user and return user with apiKey', async () => {
      const username = 'testuser';
      const email = 'test@example.com';
      const expectedApiKey = 'generated-jwt-token';

      repository.create.mockReturnValue(mockUser);
      repository.save.mockResolvedValue(mockUser);
      authService.generateApiKey.mockReturnValue(expectedApiKey);

      const result = await service.create(username, email);

      expect(repository.create).toHaveBeenCalledWith({
        username,
        email,
      });
      expect(repository.save).toHaveBeenCalledWith(mockUser);
      expect(authService.generateApiKey).toHaveBeenCalledWith(mockUser.id, mockUser.tokenVersion);
      expect(result).toEqual({
        user: mockUser,
        apiKey: expectedApiKey,
      });
    });

    it('should create user without email', async () => {
      const username = 'testuser';
      const expectedApiKey = 'generated-jwt-token';

      repository.create.mockReturnValue(mockUser);
      repository.save.mockResolvedValue(mockUser);
      authService.generateApiKey.mockReturnValue(expectedApiKey);

      const result = await service.create(username);

      expect(repository.create).toHaveBeenCalledWith({
        username,
        email: undefined,
      });
      expect(result).toEqual({
        user: mockUser,
        apiKey: expectedApiKey,
      });
    });
  });

  describe('revokeAllApiKeys', () => {
    it('should increment token version for user', async () => {
      const userId = 'test-user-id';

      repository.increment.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await service.revokeAllApiKeys(userId);

      expect(repository.increment).toHaveBeenCalledWith({ id: userId }, 'tokenVersion', 1);
    });
  });

  describe('findOne', () => {
    it('should return user when found', async () => {
      const userId = 'test-user-id';

      repository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.findOne(userId);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: userId });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const userId = 'non-existent-id';

      repository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne(userId);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: userId });
      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should return user when found by username', async () => {
      const username = 'testuser';

      repository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.findByUsername(username);

      expect(repository.findOneBy).toHaveBeenCalledWith({ username });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found by username', async () => {
      const username = 'nonexistent';

      repository.findOneBy.mockResolvedValue(null);

      const result = await service.findByUsername(username);

      expect(repository.findOneBy).toHaveBeenCalledWith({ username });
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser];

      repository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });
});
