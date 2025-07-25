import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AvailableBankResponse } from 'splice-api';
import { BankRegistryService } from './bank-registry.service';

@ApiTags('banks')
@Controller('banks')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class BankRegistryController {
  constructor(private readonly bankRegistryService: BankRegistryService) {}

  @Get('available')
  @ApiOperation({ summary: 'Get list of available banks for connection' })
  @ApiResponse({ status: 200, description: 'List of available banks' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
