import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(_: Request, res: Response, next: NextFunction) {
    // Prevent browsers from performing MIME-type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Strict Transport Security: force HTTPS
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );

    // Prevent iframe embedding
    res.setHeader('X-Frame-Options', 'DENY');

    // Enable Cross-Site Script (XSS) filter
    res.setHeader('X-XSS-Protection', '1; mode=block');

    next();
  }
}
