import type { BaseInterface } from '../common/base.types';

export interface User extends BaseInterface {
  username: string;
  email?: string;
  tokenVersion: number;
}
