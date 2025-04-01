import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const VaultToken = createParamDecorator(
  (_, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.vaultToken;
  },
);
