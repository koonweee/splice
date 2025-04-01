import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TransactionsService } from 'src/transactions/transactions.service';
import { VaultTokenGuard } from 'src/auth/vault-token.guard';
import { VaultToken } from 'src/auth/decorators/vault-token.decorator';
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('by-account')
  @UseGuards(VaultTokenGuard)
  async getByAccount(@Query('accountName') accountName: string, @VaultToken() vaultToken: string) {
    return this.transactionsService.getTransactionsForAccount(accountName, vaultToken);
  }

  @Get('accounts')
  @UseGuards(VaultTokenGuard)
  async getAccounts(@VaultToken() vaultToken: string) {
    return this.transactionsService.getAccounts();
  }

  // @Get('generate-jwt')
  // async generateJwt() {
  //   return this.jwtService.signAsync({ userId: 'koonweee' });
  // }

  @Get('secret')
  async getSecret(@Query('secretId') secretId: string ) {
    return this.transactionsService.getSecret(secretId);
  }
}
