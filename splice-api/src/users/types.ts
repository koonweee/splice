import { BaseInterface } from '../common/base.types';

export interface User extends BaseInterface {
  uuid: string;
  username: string;
  email?: string;
  tokenVersion: number;
}
