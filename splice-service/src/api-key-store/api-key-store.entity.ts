import { ApiKeyType } from '@splice/api';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
@Index(['userUuid', 'keyType'], { unique: true })
export class ApiKeyStore {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ type: 'uuid' })
  userUuid: string;

  @Column({
    type: 'enum',
    enum: ApiKeyType,
  })
  keyType: ApiKeyType;

  @Column({ type: 'text' })
  encryptedKey: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
export { ApiKeyType };
