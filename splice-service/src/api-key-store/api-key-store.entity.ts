import { ApiKeyStore, ApiKeyType } from '@splice/api';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';

@Entity()
@Index(['userUuid', 'keyType'], { unique: true })
export class ApiKeyStoreEntity extends BaseEntity implements ApiKeyStore {
  @Column({ type: 'uuid' })
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
}
export { ApiKeyType };
