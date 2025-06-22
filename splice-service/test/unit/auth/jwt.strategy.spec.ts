import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { JwtStrategy } from '../../../src/auth/jwt.strategy';
import { UserService } from '../../../src/users/user.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userService: jest.Mocked<UserService>;

  const mockUser = {
    id: 'test-id',
    username: 'testuser',
    email: 'test@example.com',
    tokenVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUserService = {
      findOne: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'jwt.secret') {
          return 'test-jwt-secret';
        }
        return undefined;
      }),
      getOrThrow: jest.fn((key: string) => {
        if (key === 'jwt.secret') {
          return 'test-jwt-secret';
        }
        throw new Error(`Config key ${key} not found`);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user when token is valid and version matches', async () => {
      const payload = {
        sub: 'test-user-id',
        ver: 1,
      };

      userService.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(userService.findOne).toHaveBeenCalledWith('test-user-id');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const payload = {
        sub: 'test-user-id',
        ver: 1,
      };

      userService.findOne.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      expect(userService.findOne).toHaveBeenCalledWith('test-user-id');
    });

    it('should return user when token version matches user version', async () => {
      const payload = {
        sub: 'test-user-id',
        ver: 1,
      };

      userService.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(userService.findOne).toHaveBeenCalledWith('test-user-id');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when token version does not match user version', async () => {
      const payload = {
        sub: 'test-user-id',
        ver: 1,
      };

      const userWithDifferentVersion = {
        ...mockUser,
        tokenVersion: 2,
      };

      userService.findOne.mockResolvedValue(userWithDifferentVersion);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      expect(userService.findOne).toHaveBeenCalledWith('test-user-id');
    });

    it('should throw UnauthorizedException when no version is provided in payload', async () => {
      const payload = {
        sub: 'test-user-id',
      };

      const userWithAnyVersion = {
        ...mockUser,
        tokenVersion: 5,
      };

      userService.findOne.mockResolvedValue(userWithAnyVersion);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      expect(userService.findOne).toHaveBeenCalledWith('test-user-id');
    });

    it('should throw UnauthorizedException with correct message when user not found', async () => {
      const payload = {
        sub: 'test-user-id',
        ver: 1,
      };

      userService.findOne.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow('User not found');
    });

    it('should throw UnauthorizedException with correct message when token is revoked', async () => {
      const payload = {
        sub: 'test-user-id',
        ver: 1,
      };

      const userWithDifferentVersion = {
        ...mockUser,
        tokenVersion: 2,
      };

      userService.findOne.mockResolvedValue(userWithDifferentVersion);

      await expect(strategy.validate(payload)).rejects.toThrow('Token has been revoked');
    });
  });
});
