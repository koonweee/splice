import { ApiKeyType } from '@splice/api';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
@Index(['userUuid', 'keyType'], { unique: true })
export class ApiKeyStore {
  @PrimaryGeneratedColumn('uuid')
  declare uuid: string;

  @Column({ type: 'uuid' })
  declare userUuid: string;

  @Column({
    type: 'enum',
    enum: ApiKeyType,
  })
  declare keyType: ApiKeyType;

  @Column({ type: 'text' })
  declare encryptedKey: string;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}
export { ApiKeyType };
