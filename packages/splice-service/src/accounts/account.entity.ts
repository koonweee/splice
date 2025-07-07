import { StandardizedAccount, StandardizedAccountBalances, StandardizedAccountType } from 'splice-api';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BankConnectionEntity } from '../bank-connections/bank-connection.entity';
import { BaseEntity } from '../common/base.entity';
import { TransactionEntity } from '../transactions/transaction.entity';

@Entity()
export class AccountEntity extends BaseEntity implements StandardizedAccount {
  @Column({ type: 'uuid' })
  declare bankConnectionId: string;

  @Column()
  declare providerAccountId: string;

  @Column()
  declare name: string;

  @Column({ type: 'jsonb' })
  declare balances: StandardizedAccountBalances;

  @Column({ nullable: true })
  declare mask?: string;

  @Column({ type: 'jsonb' })
  declare type: StandardizedAccountType;

  // Relationships
  @ManyToOne(() => BankConnectionEntity)
  @JoinColumn({ name: 'bankConnectionId' })
  declare bankConnection: BankConnectionEntity;

  @OneToMany(
    () => TransactionEntity,
    (transaction) => transaction.account,
  )
  declare transactions: TransactionEntity[];
}
