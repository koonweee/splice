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
      if (error instanceof Error) {
        this.logger.error(`Failed to retrieve secret ${secretId}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Create a new secret in the vault
   * @param key The key for the secret
   * @param value The value object for the secret (will be JSON stringified)
   * @param accessToken The Bitwarden access token
   * @param organizationId The organization ID where the secret will be created
   * @returns The created secret response
   */
  async createSecret(key: string, value: object, accessToken: string, organizationId: string): Promise<string> {
    try {
      const client = await this.getBitwardenClient(accessToken);
      const stringifiedValue = JSON.stringify(value, null, 2);
      const secret = await client.secrets().create(organizationId, key, stringifiedValue, '', []);
      this.logger.log(`Created secret with key: ${key}`);
      return secret.id;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to create secret ${key}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * List all secrets in the organization
   * @param accessToken The Bitwarden access token
   * @param organizationId The organization ID to list secrets from
   * @returns Array of secret identifiers
   */
  async listSecrets(
    accessToken: string,
    organizationId: string,
  ): Promise<Array<{ id: string; key: string; organizationId: string }>> {
    try {
      const client = await this.getBitwardenClient(accessToken);
      const secretsResponse = await client.secrets().list(organizationId);
      return secretsResponse.data.map((secret) => ({
        id: secret.id,
        key: secret.key,
        organizationId: secret.organizationId,
      }));
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to list secrets for organization ${organizationId}: ${error.message}`);
      }
      throw error;
    }
  }
}
