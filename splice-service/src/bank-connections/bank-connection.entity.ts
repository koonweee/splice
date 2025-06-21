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
  declare id: string;

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

  @Column({ type: 'uuid' })
  declare authDetailsUuid: string;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  declare user: User;

  @ManyToOne(() => BankRegistry)
  @JoinColumn({ name: 'bankId' })
  declare bank: BankRegistry;
}
