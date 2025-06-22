import { Bank, BankSourceType } from '@splice/api';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class BankEntity implements Bank {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

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

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}
