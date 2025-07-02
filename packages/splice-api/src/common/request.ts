import type { User } from '../users';

export interface AuthenticatedRequest extends Request {
  user: User;
}
