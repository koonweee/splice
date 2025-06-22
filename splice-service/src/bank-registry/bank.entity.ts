import { Bank, BankSourceType } from '@splice/api';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/base.entity';

@Entity()
export class BankEntity extends BaseEntity implements Bank {
  @Column()
  declare name: string;

  @Column({ nullable: true })
  declare logoUrl?: string;

  @Column({
    type: 'enum',
    enum: BankSourceType,
  })
  declare sourceType: BankSourceType;

  @Column({ nullable: true })
  declare scraperIdentifier?: string;

  @Column({ default: true })
  declare isActive: boolean;
}
