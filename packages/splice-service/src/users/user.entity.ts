import { User } from '@splice/api';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/base.entity';

@Entity()
export class UserEntity extends BaseEntity implements User {
  @Column()
  declare username: string;

  @Column()
  declare email?: string;

  @Column({ type: 'int', default: 1 })
  declare tokenVersion: number;
}
