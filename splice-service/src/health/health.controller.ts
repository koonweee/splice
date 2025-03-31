import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health-check')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check() {
    return this.healthService.check();
  }
}
