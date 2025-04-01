import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

/**
 * Allows callers of the API to pass vault token as the x-vault-token header
 */
@Injectable()
export class VaultTokenGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const vaultToken = request.headers['x-vault-token'];

    if (!vaultToken) {
      throw new UnauthorizedException('Missing vault token');
    }

    if (!this.isValidVaultToken(vaultToken)) {
      throw new UnauthorizedException('Invalid vault token format');
    }

    // Store token in request for later use
    request['vaultToken'] = vaultToken;
    return true;
  }

  private isValidVaultToken(token: string | string[]): boolean {
    if (Array.isArray(token)) {
      return false
    }
    // TODO: Implement actual vault token validation
    return true;
  }
}
