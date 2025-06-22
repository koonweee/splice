export interface User {
  uuid: string;
  username: string;
  email?: string;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}
