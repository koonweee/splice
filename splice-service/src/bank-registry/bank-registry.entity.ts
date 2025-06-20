import { BankSourceType } from '@splice/api';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class BankRegistry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  logoUrl?: string;

  @Column({
    type: 'enum',
    enum: BankSourceType,
  })
  sourceType: BankSourceType;

  @Column({ nullable: true })
  scraperIdentifier?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
