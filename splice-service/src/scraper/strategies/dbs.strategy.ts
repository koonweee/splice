import { Injectable, Logger } from '@nestjs/common';
import { ScrapedData } from '@splice/api';
import { unlink } from 'fs/promises';
import { Page } from 'playwright';
import { CSVLoader } from 'src/scraper/strategies/loaders/csv.loader';
import { parseDBSCSV } from 'src/scraper/strategies/parsers/dbs-checking-savings-csv.parser';
import { ScraperStrategy } from 'src/scraper/strategies/types';

type AccountSelectorOption = {
  text: string;
  value: string;
}

enum AccountType {
  SAVINGS_OR_CHECKING = 'savings_or_checking',
  CREDIT_CARD = 'credit_card',
}

type AccountInformation = {
  transactions: object[];
  totalBalance: number;
  type: AccountType;
}

@Injectable()
export class DBSStrategy implements ScraperStrategy {
  name = 'dbs';
  startUrl = 'https://internet-banking.dbs.com.sg/IB/Welcome';

  private async screenshotStep(page: Page, stepName: string, logger: Logger) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({
        path: `screenshots/${timestamp}-${stepName}.png`,
        fullPage: true
    });
    logger.debug(`Screenshot saved: ${stepName}`);
  }

  private parseCredentialsFromSecret(secret: string): { username: string, password: string } {
    // DBS secret is a JSON string with username and password
    const secretJson: { username: string, password: string } = JSON.parse(secret);
    return {
      username: secretJson.username,
      password: secretJson.password,
    };
  }

  async scrape(secret: string, page: Page, logger: Logger): Promise<ScrapedData> {
    const { username, password } = this.parseCredentialsFromSecret(secret);
    logger.log('Starting DBS scraping process');
    // Fill username and pin
    await page.locator('#UID').fill(username);
    await page.locator('#PIN').fill(password);
    logger.log('Filled username and pin');
    await this.screenshotStep(page, 'after-filling-credentials', logger);

    // Click login button
    await page.getByRole('button', { name: 'Login' }).click();
    logger.log('Clicked login button');
    await this.screenshotStep(page, 'after-login-click', logger);

    // Click authenticate now to begin the authentication process (user should get prompt on mobile app)
    await page.locator('frame[name="user_area"]').contentFrame().locator('iframe[name="iframe1"]').contentFrame().getByRole('link', { name: 'Authenticate now' }).click();
    await this.screenshotStep(page, 'after-authenticate-click', logger);

    logger.log('Awaiting user authentication in App, waiting up to 5 minutes');

    // Prompt process may take up to 5 minutes. Upon success, expect to see the Welcome Back message
    await page.locator('frame[name="user_area"]')
        .contentFrame()
        .locator('iframe[name="iframe1"]')
        .contentFrame()
        .getByRole('heading', { name: 'Welcome Back' })
        .click({ timeout: 300000 }); // 5 minutes = 300000 milliseconds

    logger.log('Authenticated in App');
    await this.screenshotStep(page, 'after-authentication', logger);

    // Navigate to Transaction History page
    await page.locator('frame[name="user_area"]').contentFrame().getByRole('heading', { name: 'My Accounts' }).click();
    await this.screenshotStep(page, 'after-my-accounts-click', logger);

    await page.locator('frame[name="user_area"]').contentFrame().getByRole('link', { name: 'View Transaction History' }).click();
    await this.screenshotStep(page, 'after-transaction-history-click', logger);

    logger.log('Navigated to Transaction History page');

    // Extract all account details from the account selector
    const accountSelector = page.locator('frame[name="user_area"]').contentFrame().locator('iframe[name="iframe1"]').contentFrame().locator('#account_number_select');

    // Wait for the selector to be visible
    logger.log('Waiting for account selector to be visible');
    await accountSelector.waitFor({ state: 'visible' });
    await this.screenshotStep(page, 'account-selector-visible', logger);

    const accountOptions = await accountSelector.locator('option').all();

    // Use Promise.all to handle async operations correctly
    const accountSelectorOptions: AccountSelectorOption[] = await Promise.all(
      accountOptions.map(async (option) => {
        const text = await option.textContent();
        const optionValue = await option.getAttribute('value');
        return { text: text.trim(), value: optionValue };
      })
    );

    // Filter out the "Please select" option
    const filteredAccounts = accountSelectorOptions.filter(account => account && !account.text.includes('Please select'));
    logger.log('Found accounts:', filteredAccounts);

    const accountInformation: Record<string, {
      transactions: object[];
      totalBalance: number;
    }> = {};

    // Process accounts sequentially instead of in parallel
    for (const account of filteredAccounts) {
      logger.log(`Processing account: ${account.text}`);
      const info = await this.getAccountInformation(page, account, logger);
      accountInformation[account.text] = info;
    }

    return accountInformation;
  }

  private async getAccountInformation(page: Page, accountSelectorOption: AccountSelectorOption, logger: Logger): Promise<AccountInformation> {
    const accountSelector = page.locator('frame[name="user_area"]').contentFrame().locator('iframe[name="iframe1"]').contentFrame().locator('#account_number_select');
    await accountSelector.selectOption(accountSelectorOption.value);
    await this.screenshotStep(page, `after-selecting-account-${accountSelectorOption.value}`, logger);

    const transactionPeriodInput = page.locator('frame[name="user_area"]').contentFrame().locator('iframe[name="iframe1"]').contentFrame().locator('#selectRange')
    /**
     * Wait for the transaction period selector to be visible. Use this to determine if we are scraping a savings/checking or credit card account, since the transaction period selector is not present for credit cards.
     * If the transaction period selector is not visible, we are scraping a credit card account.
     */
    let accountType: AccountType;
    try {
      await transactionPeriodInput.waitFor({ state: 'visible', timeout: 2000 }); // Credit cards do not have a transaction period selector, only wait 2 seconds
      accountType = AccountType.SAVINGS_OR_CHECKING;
    } catch (error) {
      logger.log('Transaction period selector not found, assuming credit card');
      accountType = AccountType.CREDIT_CARD;
    }

    if (accountType === AccountType.SAVINGS_OR_CHECKING) {
      // Click the transaction period selector to open the dropdown
      await transactionPeriodInput.click();
      // Select the last 3 months option
      const last3MonthsOption = page.locator('frame[name="user_area"]').contentFrame().locator('iframe[name="iframe1"]').contentFrame().getByRole('listitem').filter({ hasText: 'Last 3 Months' })
      // Wait for the last 3 months option to be visible then click it
      await last3MonthsOption.waitFor({ state: 'visible' });
      await last3MonthsOption.click();
      await this.screenshotStep(page, 'after-filling-transaction-period', logger);
    } else {
      // Early return for credit cards, we don't support scraping their transactions yet
      return {
        transactions: [],
        totalBalance: 0,
        type: accountType,
      };
    }

    // Click the "Go" button to load the transactions
    await page.locator('frame[name="user_area"]').contentFrame().locator('iframe[name="iframe1"]').contentFrame().getByRole('button', { name: 'Go' }).click();
    await this.screenshotStep(page, 'after-go-button-click', logger);

    // Wait for the Download button to be visible
    const downloadButton = page.locator('frame[name="user_area"]').contentFrame().locator('iframe[name="iframe1"]').contentFrame().getByRole('link', { name: 'Download' })
    await downloadButton.waitFor({ state: 'visible' });
    await this.screenshotStep(page, 'download-button-visible', logger);

    // Click the Download button
    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    await this.screenshotStep(page, 'after-download-click', logger);
    const download = await downloadPromise;

    // Save the downloaded file to the downloads folder
    const downloadsPath = process.cwd() + '/downloads';
    const fileName = `${accountSelectorOption.text}-${accountType}-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    await download.saveAs(downloadsPath + `/${fileName}`);

    logger.log(`Downloaded transactions to ${downloadsPath}/${fileName}`);

    // Load the CSV file and parse it
    const csvLoader = new CSVLoader();
    const csvContent = await csvLoader.load(downloadsPath + `/${fileName}`);
    const parsedCSV = parseDBSCSV(csvContent);

    // Delete the CSV file
    await unlink(downloadsPath + `/${fileName}`);

    // Extract total balance from text
    const totalBalance = page.locator('frame[name="user_area"]').contentFrame().locator('iframe[name="iframe1"]').contentFrame().getByText('Total Balance:')
    const totalBalanceText = await totalBalance.textContent();
    const totalBalanceAmount = totalBalanceText.split(' ')[1];
    logger.log(`Total balance: ${totalBalanceAmount}`);

    // Strip non-numeric characters, then parse as float
    const totalBalanceAsNumber = parseFloat(totalBalanceAmount.replace(/[^0-9.-]+/g, ''));
    logger.log(`Total balance as number: ${totalBalanceAsNumber}`);

    // Return placeholder for now, TODO: parse the CSV file
    return {
      transactions: parsedCSV.transactions,
      totalBalance: parsedCSV.ledgerBalance,
      type: accountType,
    };
  }
}
