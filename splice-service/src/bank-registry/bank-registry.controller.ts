import { Controller, Get } from '@nestjs/common';
import { AvailableBankResponse } from '@splice/api';
import { BankRegistryService } from './bank-registry.service';

@Controller('banks')
export class BankRegistryController {
  constructor(private readonly bankRegistryService: BankRegistryService) {}

  @Get('available')
  async getAvailableBanks(): Promise<AvailableBankResponse[]> {
    const banks = await this.bankRegistryService.findAllActive();

    return banks.map((bank) => ({
      id: bank.id,
      name: bank.name,
      logoUrl: bank.logoUrl,
      sourceType: bank.sourceType,
    }));
  }
}
