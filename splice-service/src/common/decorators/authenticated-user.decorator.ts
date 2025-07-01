import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '@splice/api';

/**
 * Decorator to get user on requests that have been authenticated by JWT
 */
export const AuthenticatedUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const castedRequest = request as AuthenticatedRequest;
  const { user } = castedRequest;
  if (!user) {
    throw new Error('Attempted to access user on non-authenticated request');
  }
  return user;
});
