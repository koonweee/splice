import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AccountBase,
  AccountSubtype,
  AccountType,
  Configuration,
  CountryCode,
  LinkTokenCreateRequest,
  LinkTokenCreateResponse,
  PlaidApi,
  PlaidEnvironments,
  Products,
  Transaction,
} from 'plaid';
import {
  BankConnection,
  DataSourceAdapter,
  StandardizedAccount,
  StandardizedAccountType,
  StandardizedTransaction,
} from 'splice-api';
import { z } from 'zod';
import { VaultService } from '../../vault/vault.service';

// Zod schema for plaid connection finalization payload
const PlaidFinalizeConnectionSchema = z.object({
  accessToken: z.string().min(1, 'Plaid access token for the account is required'),
});

@Injectable()
export class PlaidAdapter implements DataSourceAdapter<LinkTokenCreateResponse> {
  private readonly logger = new Logger(PlaidAdapter.name);
  private readonly plaidApiClient: PlaidApi;

  constructor(
    private readonly configService: ConfigService,
    private readonly vaultService: VaultService,
  ) {
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

  async fetchAccounts(connection: BankConnection, vaultAccessToken: string): Promise<StandardizedAccount[]> {
    this.logger.log(`Fetching accounts for plaid connection ${connection.id}`);

    // Throw if authDetailsUuid is not set
    if (!connection.authDetailsUuid) {
      throw new BadRequestException('Auth details UUID is not set for connection');
    }

    const authDetails = await this.getAuthDetails(connection, vaultAccessToken);

    // Fetch accounts from plaid
    const { data: plaidAccountsData } = await this.plaidApiClient.accountsGet({
      access_token: authDetails.accessToken,
    });

    return plaidAccountsData.accounts.map((account) =>
      this.plaidAccountToStandardizedAccount(account, connection.bank.name),
    );
  }

  plaidAccountToStandardizedAccount(account: AccountBase, bankName: string): StandardizedAccount {
    return {
      id: account.account_id,
      name: account.name,
      mask: account.mask ?? undefined,
      type: this.plaidAccountTypeToStandardizedAccountType(account.type, account.subtype),
      balances: {
        current: account.balances.current ?? undefined,
        available: account.balances.available ?? undefined,
        isoCurrencyCode: account.balances.iso_currency_code ?? undefined,
        unofficialCurrencyCode: account.balances.unofficial_currency_code ?? undefined,
        lastUpdated: account.balances.last_updated_datetime ?? undefined,
      },
      institution: bankName,
    };
  }

  plaidAccountTypeToStandardizedAccountType(
    accountType: AccountType,
    subType: AccountSubtype | null,
  ): StandardizedAccountType {
    switch (accountType) {
      case AccountType.Depository:
        switch (subType) {
          case AccountSubtype.Checking:
            return StandardizedAccountType.CHECKING;
          case AccountSubtype.Savings:
            return StandardizedAccountType.SAVINGS;
        }
        break;
      case AccountType.Credit:
        return StandardizedAccountType.CREDIT_CARD;
      case AccountType.Investment:
        return StandardizedAccountType.INVESTMENT;
    }
    return StandardizedAccountType.OTHER;
  }

  async fetchTransactions(
    connection: BankConnection,
    startDate: Date,
    endDate: Date,
    vaultAccessToken: string,
    accountId?: string,
  ): Promise<StandardizedTransaction[]> {
    this.logger.log(
      `Fetching transactions for plaid connection ${connection.id}, account ${accountId} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    if (!connection.authDetailsUuid) {
      throw new BadRequestException('Auth details UUID is not set for connection');
    }

    // Plaid requires account id, throw if not provided
    if (!accountId) {
      throw new BadRequestException('Account ID is required for plaid transactions');
    }

    const authDetails = await this.getAuthDetails(connection, vaultAccessToken);

    const transactions = await this.plaidApiClient.transactionsGet({
      access_token: authDetails.accessToken,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      options: {
        account_ids: [accountId],
      },
    });

    this.logger.log(
      `Fetched ${transactions.data.transactions.length} transactions for plaid connection ${connection.id}`,
      transactions.data.transactions,
    );

    return transactions.data.transactions.map((transaction) =>
      this.plaidTransactionToStandardizedTransaction(transaction),
    );
  }

  plaidTransactionToStandardizedTransaction(transaction: Transaction): StandardizedTransaction {
    return {
      id: transaction.transaction_id,
      accountId: transaction.account_id,
      date: transaction.date,
      datetime: transaction.datetime ?? undefined,
      description: transaction.name,
      merchantName: transaction.merchant_name ?? undefined,
      pending: transaction.pending,
      logoUrl: transaction.logo_url ?? undefined,
      websiteUrl: transaction.website ?? undefined,
      amount: transaction.amount,
      isoCurrencyCode: transaction.iso_currency_code ?? undefined,
      unofficialCurrencyCode: transaction.unofficial_currency_code ?? undefined,
      type: transaction.amount > 0 ? 'DEBIT' : 'CREDIT',
    };
  }

  async getAuthDetails(connection: BankConnection, vaultAccessToken: string): Promise<{ accessToken: string }> {
    if (!connection.authDetailsUuid) {
      throw new BadRequestException('Auth details UUID is not set for connection');
    }

    const vaultSecret = await this.vaultService.getSecret(connection.authDetailsUuid, vaultAccessToken);

    // Parse as JSON
    const authDetails = JSON.parse(vaultSecret);

    // Ensure it has accessToken (using zod)
    let parsedAuthDetails: { accessToken: string };
    try {
      parsedAuthDetails = PlaidFinalizeConnectionSchema.parse(authDetails);
    } catch (error) {
      this.logger.error(`Plaid connection payload validation failed: ${error}`);
      throw new BadRequestException(`Validation failed: ${error}`);
    }

    return parsedAuthDetails;
  }
}
