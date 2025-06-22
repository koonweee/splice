import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { User } from '@splice/api';
import type { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { UserEntity } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private authService: AuthService,
  ) {}

  async create(username: string, email?: string): Promise<{ user: User; apiKey: string }> {
    const user = this.userRepository.create({
      username,
      email,
    });
    const savedUser = await this.userRepository.save(user);

    const apiKey = this.authService.generateApiKey(savedUser.id, savedUser.tokenVersion);

    return { user: savedUser, apiKey };
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOne(id: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ id });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ username });
  }

  async revokeAllApiKeys(id: string): Promise<void> {
    await this.userRepository.increment({ id }, 'tokenVersion', 1);
  }
}
