import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { User } from '@splice/api';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../users/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private userService: UserService,
  ) {
    const secret = configService.getOrThrow<string>('jwt.secret');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: string; ver?: number }): Promise<User> {
    const user = await this.userService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check token version if provided in payload
    if (user.tokenVersion !== payload.ver) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return user;
  }
}
