import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  generateApiKey(userId: string, tokenVersion: number): string {
    return this.jwtService.sign({
      sub: userId,
      ver: tokenVersion,
    });
  }
}
