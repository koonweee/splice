import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { UserEntity } from '../../../src/users/user.entity';
import { UserService } from '../../../src/users/user.service';

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<Repository<UserEntity>>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 'test-id',
    uuid: 'test-user-uuid',
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
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(getRepositoryToken(UserEntity));
    jwtService = module.get(JwtService);
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
      jwtService.sign.mockReturnValue(expectedApiKey);

      const result = await service.create(username, email);

      expect(repository.create).toHaveBeenCalledWith({
        username,
        email,
      });
      expect(repository.save).toHaveBeenCalledWith(mockUser);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.uuid,
        ver: mockUser.tokenVersion,
      });
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
      jwtService.sign.mockReturnValue(expectedApiKey);

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
      const userUuid = 'test-user-uuid';

      repository.increment.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await service.revokeAllApiKeys(userUuid);

      expect(repository.increment).toHaveBeenCalledWith({ uuid: userUuid }, 'tokenVersion', 1);
    });
  });

  describe('findOne', () => {
    it('should return user when found', async () => {
      const userUuid = 'test-user-uuid';

      repository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.findOne(userUuid);

      expect(repository.findOneBy).toHaveBeenCalledWith({ uuid: userUuid });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const userUuid = 'non-existent-uuid';

      repository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne(userUuid);

      expect(repository.findOneBy).toHaveBeenCalledWith({ uuid: userUuid });
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
