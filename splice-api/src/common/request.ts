import type { User } from '../users';

interface JwtPayload {
  sub: string; // userId
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user: User;
}
