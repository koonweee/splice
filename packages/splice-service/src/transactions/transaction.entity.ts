import { StandardizedTransaction, TransactionCategory } from 'splice-api';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AccountEntity } from '../accounts/account.entity';
import { BaseEntity } from '../common/base.entity';

@Entity()
export class TransactionEntity extends BaseEntity implements StandardizedTransaction {
  @Column({ type: 'uuid' })
  declare accountId: string;

  @Column()
  declare providerTransactionId: string;

  @Column()
  declare providerAccountId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  declare amount: number;

  @Column({ nullable: true })
  declare isoCurrencyCode?: string;

  @Column({ nullable: true })
  declare unofficialCurrencyCode?: string;

  @Column({ type: 'jsonb', nullable: true })
  declare category?: TransactionCategory;

  @Column()
  declare date: string;

  @Column()
  declare name: string;

  @Column()
  declare pending: boolean;

  @Column({ nullable: true })
  declare logoUrl?: string;

  @Column({ nullable: true })
  declare websiteUrl?: string;

  // Relationships
  @ManyToOne(
    () => AccountEntity,
    (account) => account.transactions,
  )
  @JoinColumn({ name: 'accountId' })
  declare account: AccountEntity;
}
