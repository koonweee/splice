import * as crypto from 'node:crypto';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { ApiKeyStoreEntity, type ApiKeyType } from './api-key-store.entity';

@Injectable()
export class ApiKeyStoreService {
  private readonly masterKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';

  constructor(
    @InjectRepository(ApiKeyStoreEntity)
    private apiKeyStoreRepository: Repository<ApiKeyStoreEntity>,
    private configService: ConfigService,
  ) {
    const masterKey = this.configService.get<string>('apiStoreEncryptionKey');
    if (!masterKey) {
      throw new Error('API_KEY_ENCRYPTION_KEY environment variable must be set');
    }
    this.masterKey = Buffer.from(masterKey, 'utf8');
  }

  // Derive a unique encryption key for each user
  private deriveUserKey(userId: string): Buffer {
    return crypto.pbkdf2Sync(
      this.masterKey,
      userId,
      100000, // iterations
      32, // key length
      'sha256',
    );
  }

  private encrypt(text: string, userId: string): { encryptedData: string; secret: string } {
    const userKey = this.deriveUserKey(userId);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, userKey, iv);

    let encryptedData = cipher.update(text, 'utf8', 'hex');
    encryptedData += cipher.final('hex');

    const authTag = cipher.getAuthTag();
    const secret = Buffer.concat([iv, authTag]).toString('hex');

    return { encryptedData, secret };
  }

  private decrypt(encryptedData: string, secret: string, userId: string): string {
    const userKey = this.deriveUserKey(userId);
    const secretBuffer = Buffer.from(secret, 'hex');
    const iv = secretBuffer.subarray(0, 16);
    const authTag = secretBuffer.subarray(16);

    const decipher = crypto.createDecipheriv(this.algorithm, userKey, iv);
    decipher.setAuthTag(authTag);

    try {
      let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
      decryptedData += decipher.final('utf8');
      return decryptedData;
    } catch (_error) {
      throw new UnauthorizedException('Invalid secret or tampering detected');
    }
  }

  async storeApiKey(userId: string, apiKey: string, keyType: ApiKeyType): Promise<string> {
    const { encryptedData, secret } = this.encrypt(apiKey, userId);

    const apiKeyStore = this.apiKeyStoreRepository.create({
      userId,
      keyType,
      encryptedKey: encryptedData,
    });

    await this.apiKeyStoreRepository.save(apiKeyStore);
    return secret;
  }

  async retrieveApiKey(userId: string, keyType: ApiKeyType, secret: string): Promise<string> {
    const storedKey = await this.apiKeyStoreRepository.findOne({
      where: {
        userId,
        keyType,
      },
    });

    if (!storedKey) {
      throw new NotFoundException('API key not found');
    }

    return this.decrypt(storedKey.encryptedKey, secret, userId);
  }
}
