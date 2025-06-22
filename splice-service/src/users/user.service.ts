import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { UserEntity } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
  ) {}

  async create(username: string, email?: string): Promise<{ user: UserEntity; apiKey: string }> {
    const user = this.userRepository.create({
      username,
      email,
    });
    const savedUser = await this.userRepository.save(user);

    const apiKey = this.jwtService.sign({
      sub: savedUser.id,
      ver: savedUser.tokenVersion,
    });

    return { user: savedUser, apiKey };
  }

  async findAll(): Promise<UserEntity[]> {
    return await this.userRepository.find();
  }

  async findOne(id: string): Promise<UserEntity | null> {
    return await this.userRepository.findOneBy({ id });
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return await this.userRepository.findOneBy({ username });
  }

  async revokeAllApiKeys(id: string): Promise<void> {
    await this.userRepository.increment({ id }, 'tokenVersion', 1);
  }
}
