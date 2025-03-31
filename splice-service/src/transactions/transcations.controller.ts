import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from 'src/auth/auth.guard';
import { TransactionsService } from 'src/transactions/transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('byAccount')
  async getByAccount(@Query('accountName') accountName: string) {
    return this.transactionsService.getTransactionsForAccount(accountName);
  }

  @Get('accounts')
  @UseGuards(AuthGuard)
  async getAccounts() {
    return this.transactionsService.getAccounts();
  }

  @Get('generate-jwt')
  async generateJwt() {
    return this.jwtService.signAsync({ userId: 'koonweee' });
  }

  @Get('secret')
  async getSecret(@Query('secretId') secretId: string ) {
    return this.transactionsService.getSecret(secretId);
  }
}
