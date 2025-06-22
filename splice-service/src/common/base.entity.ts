import { BaseInterface } from '@splice/api';
import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export abstract class BaseEntity implements BaseInterface {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}
