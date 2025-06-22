import { ApiKeyStore, ApiKeyType } from '@splice/api';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';

@Entity()
@Index(['userId', 'keyType'], { unique: true })
export class ApiKeyStoreEntity extends BaseEntity implements ApiKeyStore {
  @Column({ type: 'uuid' })
  declare userId: string;

  @Column({
    type: 'enum',
    enum: ApiKeyType,
  })
  declare keyType: ApiKeyType;

  @Column({ type: 'text' })
  declare encryptedKey: string;
}
export { ApiKeyType };
