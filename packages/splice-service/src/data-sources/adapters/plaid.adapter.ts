import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AccountBase,
  AccountSubtype,
  Configuration,
  CountryCode,
  LinkTokenCreateRequest,
  LinkTokenCreateResponse,
  AccountType as PlaidAccountType,
  PlaidApi,
  PlaidEnvironments,
  Products,
  Transaction,
} from 'plaid';
import {
  AccountType,
  BankConnection,
  CreditAccountSubtype,
  DataSourceAdapter,
  DepositoryAccountSubtype,
  InvestmentAccountSubtype,
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

    return plaidAccountsData.accounts.map((account) => this.plaidAccountToStandardizedAccount(account, connection));
  }

  plaidAccountToStandardizedAccount(account: AccountBase, connection: BankConnection): StandardizedAccount {
    return {
      // TODO: This is not the correct ID, we should generate a new ID
      id: account.account_id,
      bankConnection: connection,
      providerAccountId: account.account_id,
      balances: {
        current: account.balances.current ?? undefined,
        available: account.balances.available ?? undefined,
        isoCurrencyCode: account.balances.iso_currency_code ?? undefined,
        unofficialCurrencyCode: account.balances.unofficial_currency_code ?? undefined,
        lastUpdated: account.balances.last_updated_datetime ?? undefined,
      },
      mask: account.mask ?? undefined,
      name: account.name,
      type: this.plaidAccountTypeToStandardizedAccountType(account.type, account.subtype),
    };
  }

  plaidAccountTypeToStandardizedAccountType(
    accountType: PlaidAccountType,
    subType: AccountSubtype | null,
  ): StandardizedAccountType {
    switch (accountType) {
      case PlaidAccountType.Depository:
        switch (subType) {
          case AccountSubtype.Checking:
            return {
              type: AccountType.DEPOSITORY,
              subtype: DepositoryAccountSubtype.CHECKING,
            };
          case AccountSubtype.Savings:
            return {
              type: AccountType.DEPOSITORY,
              subtype: DepositoryAccountSubtype.SAVINGS,
            };
          case AccountSubtype.Hsa:
            return {
              type: AccountType.DEPOSITORY,
              subtype: DepositoryAccountSubtype.HSA,
            };
          default:
            return {
              type: AccountType.DEPOSITORY,
            };
        }
      case PlaidAccountType.Credit:
        return {
          type: AccountType.CREDIT,
          subtype: CreditAccountSubtype.CREDIT_CARD,
        };
      case PlaidAccountType.Investment:
        switch (subType) {
          case AccountSubtype._401k:
            return {
              type: AccountType.INVESTMENT,
              subtype: InvestmentAccountSubtype._401K,
            };
          case AccountSubtype.Brokerage:
            return {
              type: AccountType.INVESTMENT,
              subtype: InvestmentAccountSubtype.BROKERAGE,
            };
          case AccountSubtype.CryptoExchange:
            return {
              type: AccountType.INVESTMENT,
              subtype: InvestmentAccountSubtype.CRYPTO_EXCHANGE,
            };
          case AccountSubtype.Hsa:
            return {
              type: AccountType.INVESTMENT,
              subtype: InvestmentAccountSubtype.HSA,
            };
          case AccountSubtype.Ira:
            return {
              type: AccountType.INVESTMENT,
              subtype: InvestmentAccountSubtype.IRA,
            };
          case AccountSubtype.Other:
            return {
              type: AccountType.INVESTMENT,
              subtype: InvestmentAccountSubtype.OTHER,
            };
          case AccountSubtype.Roth:
            return {
              type: AccountType.INVESTMENT,
              subtype: InvestmentAccountSubtype.ROTH_IRA,
            };
          case AccountSubtype.Roth401k:
            return {
              type: AccountType.INVESTMENT,
              subtype: InvestmentAccountSubtype.ROTH_401K,
            };
          default:
            return {
              type: AccountType.INVESTMENT,
            };
        }
    }
    return {
      type: AccountType.OTHER,
    };
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
      this.plaidTransactionToStandardizedTransaction(transaction, accountId),
    );
  }

  plaidTransactionToStandardizedTransaction(transaction: Transaction, accountId: string): StandardizedTransaction {
    return {
      // TODO: This is not the correct ID, we should generate a new ID
      id: transaction.transaction_id,
      // TODO: This is not the correct account ID, we should generate a new ID
      accountId,
      providerTransactionId: transaction.transaction_id,
      providerAccountId: accountId,
      amount: transaction.amount,
      isoCurrencyCode: transaction.iso_currency_code ?? undefined,
      unofficialCurrencyCode: transaction.unofficial_currency_code ?? undefined,
      category: transaction.personal_finance_category
        ? {
            primary: transaction.personal_finance_category.primary,
            detailed: transaction.personal_finance_category.detailed,
            confidenceLevel: transaction.personal_finance_category.confidence_level ?? undefined,
          }
        : undefined,
      date: transaction.date,
      name: transaction.name,
      pending: transaction.pending,
      logoUrl: transaction.logo_url ?? undefined,
      websiteUrl: transaction.website ?? undefined,
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
