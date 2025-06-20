import { BankConnectionStatus } from '@splice/api';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BankRegistry } from '../bank-registry/bank-registry.entity';
import { User } from '../users/user.entity';

@Entity()
export class BankConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  bankId: string;

  @Column({
    type: 'enum',
    enum: BankConnectionStatus,
    default: BankConnectionStatus.PENDING_AUTH,
  })
  status: BankConnectionStatus;

  @Column({ nullable: true })
  alias?: string;

  @Column({ nullable: true })
  lastSync?: Date;

  @Column({ type: 'uuid' })
  authDetailsUuid: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => BankRegistry)
  @JoinColumn({ name: 'bankId' })
  bank: BankRegistry;
}
