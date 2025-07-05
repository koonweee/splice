import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Bank, DataSourceType } from '@splice/api';
import { Repository } from 'typeorm';
import { BankEntity } from './bank.entity';

@Injectable()
export class BankRegistryService implements OnModuleInit {
  private readonly logger = new Logger(BankRegistryService.name);

  constructor(
    @InjectRepository(BankEntity)
    private bankRegistryRepository: Repository<BankEntity>,
  ) {}

  async onModuleInit() {
    await this.seedBankRegistry();
  }

  async findAllActive(): Promise<Bank[]> {
    return this.bankRegistryRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Bank | null> {
    return this.bankRegistryRepository.findOne({ where: { id } });
  }

  async findByScraperIdentifier(scraperIdentifier: string): Promise<Bank | null> {
    return this.bankRegistryRepository.findOne({
      where: { scraperIdentifier, isActive: true },
    });
  }

  private async seedBankRegistry(): Promise<void> {
    this.logger.log('Seeding bank registry...');

    const existingBanks = await this.bankRegistryRepository.count();

    const banksToSeed = [
      {
        name: 'DBS Bank',
        sourceType: DataSourceType.SCRAPER,
        scraperIdentifier: 'dbs',
        isActive: true,
      },
      {
        name: 'Plaid',
        sourceType: DataSourceType.PLAID,
        isActive: true,
      },
    ];

    if (existingBanks === banksToSeed.length) {
      this.logger.log('Bank registry already seeded, skipping');
      return;
    }

    for (const bankData of banksToSeed) {
      const existingBank = await this.bankRegistryRepository.findOne({
        where: { name: bankData.name, sourceType: bankData.sourceType },
      });

      if (!existingBank) {
        const bank = this.bankRegistryRepository.create(bankData);
        await this.bankRegistryRepository.save(bank);
        this.logger.log(`Seeded bank: ${bankData.name}`);
      }
    }

    this.logger.log('Bank registry seeding completed');
  }
}
