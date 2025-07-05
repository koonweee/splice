import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Configuration,
  CountryCode,
  LinkTokenCreateRequest,
  LinkTokenCreateResponse,
  PlaidApi,
  PlaidEnvironments,
  Products,
} from 'plaid';
import { BankConnection, DataSourceAdapter, StandardizedAccount, StandardizedTransaction } from 'splice-api';
import { z } from 'zod';

// Zod schema for plaid connection finalization payload
const PlaidFinalizeConnectionSchema = z.object({
  accessToken: z.string().min(1, 'Plaid access token for the account is required'),
});

@Injectable()
export class PlaidAdapter implements DataSourceAdapter<LinkTokenCreateResponse> {
  private readonly logger = new Logger(PlaidAdapter.name);
  private readonly plaidApiClient: PlaidApi;

  constructor(private readonly configService: ConfigService) {
    const { clientId, secret } = this.configService.get<{ clientId: string; secret: string }>('plaid') ?? {};
    if (!clientId || !secret) {
      throw new Error('PLAID_CLIENT_ID and PLAID_SECRET environment variables must be set');
    }

    const configuration = new Configuration({
      basePath: PlaidEnvironments.production,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': clientId,
          'PLAID-SECRET': secret,
        },
      },
    });

    this.plaidApiClient = new PlaidApi(configuration);

    this.logger.log(`Plaid adapter initialized`);
  }

  /**
   * Generates a Plaid link token for user to go through Plaid link flow on frontend
   */
  async initiateConnection(userUuid: string) {
    this.logger.log(`Initiating plaid connection, acquiring link token`);
    const plaidLinkTokenRequest: LinkTokenCreateRequest = {
      client_name: 'Splice',
      language: 'en',
      country_codes: [CountryCode.Us],
      products: [Products.Transactions],
      user: {
        client_user_id: userUuid,
      },
      hosted_link: {},
    };
    const plaidLinkTokenResponse = await this.plaidApiClient.linkTokenCreate(plaidLinkTokenRequest);
    return plaidLinkTokenResponse.data;
  }

  async validateFinalizeConnectionPayload(payload?: object): Promise<void> {
    this.logger.log(`Validating finalize connection payload for plaid connection`);

    try {
      // Use Zod to validate the payload structure
      PlaidFinalizeConnectionSchema.parse(payload);
      this.logger.log('Plaid connection payload validation successful');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
        this.logger.error(`Plaid connection payload validation failed: ${errorMessages}`);
        throw new BadRequestException(`Validation failed: ${errorMessages}`);
      }
      this.logger.error(`Plaid connection payload validation failed: ${error}`);
      // Re-throw unexpected errors
      throw new BadRequestException(`Validation failed: ${error}`);
    }
  }

  async fetchAccounts(connection: BankConnection, _vaultAccessToken: string): Promise<StandardizedAccount[]> {
    this.logger.log(`Fetching accounts for plaid connection ${connection.id}`);

    return [];
  }

  async fetchTransactions(
    connection: BankConnection,
    accountId: string,
    startDate: Date,
    endDate: Date,
    vaultAccessToken: string,
  ): Promise<StandardizedTransaction[]> {
    this.logger.log(
      `Fetching transactions for plaid connection ${connection.id}, account ${accountId} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    return [];
  }
}
