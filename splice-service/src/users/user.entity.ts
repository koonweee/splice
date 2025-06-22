import { User } from '@splice/api';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class UserEntity implements User {
  @PrimaryGeneratedColumn('uuid')
  declare uuid: string;

  @Column()
  declare username: string;

  @Column()
  declare email?: string;

  @Column({ type: 'int', default: 1 })
  declare tokenVersion: number;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}
