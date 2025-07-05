import { Bank, BankConnection, BankConnectionStatus } from 'splice-api';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BankEntity } from '../bank-registry/bank.entity';
import { BaseEntity } from '../common/base.entity';

@Entity()
export class BankConnectionEntity extends BaseEntity implements BankConnection {
  @Column({ type: 'uuid' })
  declare userId: string;

  @Column({ type: 'uuid' })
  declare bankId: string;

  @Column({
    type: 'enum',
    enum: BankConnectionStatus,
    default: BankConnectionStatus.PENDING_AUTH,
  })
  declare status: BankConnectionStatus;

  @Column({ nullable: true })
  declare alias?: string;

  @Column({ nullable: true })
  declare lastSync?: Date;

  @Column({ type: 'uuid', nullable: true })
  declare authDetailsUuid?: string;

  @ManyToOne(() => BankEntity)
  @JoinColumn({ name: 'bankId' })
  declare bank: Bank;
}
