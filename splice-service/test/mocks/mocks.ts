import { UserEntity } from '../../src/users/user.entity';

export const MOCK_USER_UUID = 'test-user-id';
export const MOCK_USER: UserEntity = {
  id: 'test-id',
  uuid: MOCK_USER_UUID,
  username: 'testuser',
  email: '',
  tokenVersion: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};
