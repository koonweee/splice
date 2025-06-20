import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BankSourceType } from '@splice/api';
import { Repository } from 'typeorm';
import { BankRegistry } from './bank-registry.entity';

@Injectable()
export class BankRegistryService implements OnModuleInit {
  private readonly logger = new Logger(BankRegistryService.name);

  constructor(
    @InjectRepository(BankRegistry)
    private bankRegistryRepository: Repository<BankRegistry>,
  ) {}

  async onModuleInit() {
    await this.seedBankRegistry();
  }

  async findAllActive(): Promise<BankRegistry[]> {
    return this.bankRegistryRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<BankRegistry | null> {
    return this.bankRegistryRepository.findOne({ where: { id } });
  }

  async findByScraperIdentifier(scraperIdentifier: string): Promise<BankRegistry | null> {
    return this.bankRegistryRepository.findOne({
      where: { scraperIdentifier, isActive: true },
    });
  }

  private async seedBankRegistry(): Promise<void> {
    this.logger.log('Seeding bank registry...');

    const existingBanks = await this.bankRegistryRepository.count();
    if (existingBanks > 0) {
      this.logger.log('Bank registry already seeded, skipping');
      return;
    }

    const banksToSeed = [
      {
        name: 'DBS Bank',
        sourceType: BankSourceType.SCRAPER,
        scraperIdentifier: 'dbs',
        isActive: true,
      },
    ];

    for (const bankData of banksToSeed) {
      const existingBank = await this.bankRegistryRepository.findOne({
        where: { scraperIdentifier: bankData.scraperIdentifier },
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
