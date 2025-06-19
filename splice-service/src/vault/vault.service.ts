import { BitwardenClient } from '@bitwarden/sdk-napi';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VaultService {
  private readonly logger = new Logger(VaultService.name);

  /**
   * Given a Bitwarden access token, create a Bitwarden client
   */
  private async getBitwardenClient(accessToken: string): Promise<BitwardenClient> {
    const client = new BitwardenClient();
    await client.auth().loginAccessToken(accessToken);
    return client;
  }

  /**
   * Get a secret by its ID from the vault
   * @param secretId The ID of the secret to retrieve
   * @returns The secret value
   */
  async getSecret(secretId: string, accessToken: string): Promise<string> {
    try {
      const client = await this.getBitwardenClient(accessToken);
      const secret = await client.secrets().get(secretId);
      return secret.value;
    } catch (error) {
      this.logger.error(`Failed to retrieve secret ${secretId}: ${error.message}`);
      throw error;
    }
  }
}
