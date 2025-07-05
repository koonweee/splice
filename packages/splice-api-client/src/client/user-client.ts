import type { CreateUserRequest, User } from 'splice-api';
import { BaseClient } from './base-client';

export class UserClient extends BaseClient {
  async createUser(request: CreateUserRequest): Promise<{ user: User; apiKey: string }> {
    return this.post<{ user: User; apiKey: string }>('/users', request);
  }

  async revokeApiKeys(): Promise<{ message: string }> {
    return this.post<{ message: string }>('/users/revoke-api-keys');
  }
}
