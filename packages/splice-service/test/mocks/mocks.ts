import { User } from 'splice-api';

export const MOCK_USER_ID = 'test-user-id';
export const MOCK_USER: User = {
  id: MOCK_USER_ID,
  username: 'testuser',
  email: '',
  tokenVersion: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};
