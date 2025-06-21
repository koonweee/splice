# Plan: Implement Comprehensive NestJS OpenAPI Support

Here is a plan to implement NestJS OpenAPI support for ALL controllers in your project, using the existing file structure and conventions.

## Phase 1: Installation and Setup

First, you'll need to install the required package for OpenAPI integration:

```bash
cd splice-service
bun add @nestjs/swagger
```

Next, initialize the Swagger module in your `main.ts` file. This will create a route that serves your OpenAPI documentation.

```typescript
// splice-service/src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Splice API')
    .setDescription('An open-source, self-hosted, and extensible alternative to Plaid\'s transaction API.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
```

## Phase 2: Decorating All Controllers and DTOs

Now, you'll need to add decorators to ALL controllers and DTOs to generate comprehensive OpenAPI documentation. Here are examples for each controller:

### 1. Health Controller

Update `health.controller.ts` with basic health check documentation:

```typescript
// splice-service/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health-check')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check application health status' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  check() {
    return this.healthService.check();
  }
}
```

### 2. Bank Registry Controller

Update `bank-registry.controller.ts` to document available banks endpoint:

```typescript
// splice-service/src/bank-registry/bank-registry.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AvailableBankResponse } from '@splice/api';
import { BankRegistryService } from './bank-registry.service';

@ApiTags('banks')
@Controller('banks')
export class BankRegistryController {
  constructor(private readonly bankRegistryService: BankRegistryService) {}

  @Get('available')
  @ApiOperation({ summary: 'Get list of available banks for connection' })
  @ApiResponse({ status: 200, description: 'List of available banks', type: [AvailableBankResponse] })
  async getAvailableBanks(): Promise<AvailableBankResponse[]> {
    const banks = await this.bankRegistryService.findAllActive();

    return banks.map((bank) => ({
      id: bank.id,
      name: bank.name,
      logoUrl: bank.logoUrl,
      sourceType: bank.sourceType,
    }));
  }
}
```

### 3. API Key Store Controller

Update `api-key-store.controller.ts` to document key storage:

```typescript
// splice-service/src/api-key-store/api-key-store.controller.ts
import { Body, Controller, Headers, Param, Post, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import type { Response } from 'express';
import { ApiKeyStoreService } from './api-key-store.service';
import { ApiKeyHeadersDto, ApiKeyParamsDto, CreateApiKeyDto } from './dto';

@ApiTags('api-keys')
@Controller('api-key-store')
export class ApiKeyStoreController {
  constructor(private readonly apiKeyStoreService: ApiKeyStoreService) {}

  @Post(':userUuid')
  @ApiOperation({ summary: 'Store encrypted API key for user' })
  @ApiHeader({ name: 'X-Api-Key', description: 'The API key to encrypt and store', required: true })
  @ApiResponse({ status: 201, description: 'API key stored successfully. Secret returned in X-Secret header.' })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  async storeApiKey(
    @Param() params: ApiKeyParamsDto,
    @Headers() headers: ApiKeyHeadersDto,
    @Body() body: CreateApiKeyDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const secret = await this.apiKeyStoreService.storeApiKey(params.userUuid, headers['X-Api-Key'], body.keyType);
    response.set('X-Secret', secret);
  }
}
```

### 4. Bank Connection Controller

Update `bank-connection.controller.ts` to document all CRUD operations:

```typescript
// splice-service/src/bank-connections/bank-connection.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BankConnectionResponse, BankConnectionStatus } from '@splice/api';
import { BankConnectionService } from './bank-connection.service';
import {
  BankConnectionByIdParamsDto,
  BankConnectionParamsDto,
  CreateBankConnectionDto,
  UpdateBankConnectionDto,
} from './dto';

@ApiTags('bank-connections')
@Controller('users/:userId/banks')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class BankConnectionController {
  constructor(private readonly bankConnectionService: BankConnectionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all bank connections for a user' })
  @ApiResponse({ status: 200, description: 'List of bank connections', type: [BankConnectionResponse] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserBankConnections(@Param() params: BankConnectionParamsDto): Promise<BankConnectionResponse[]> {
    // ... existing implementation
  }

  @Post()
  @ApiOperation({ summary: 'Create a new bank connection' })
  @ApiResponse({ status: 201, description: 'Bank connection created successfully', type: BankConnectionResponse })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createBankConnection(
    @Param() params: BankConnectionParamsDto,
    @Body() createRequest: CreateBankConnectionDto,
  ): Promise<BankConnectionResponse> {
    // ... existing implementation
  }

  @Put(':connectionId')
  @ApiOperation({ summary: 'Update an existing bank connection' })
  @ApiResponse({ status: 200, description: 'Bank connection updated successfully', type: BankConnectionResponse })
  @ApiResponse({ status: 404, description: 'Bank connection not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateBankConnection(
    @Param() params: BankConnectionByIdParamsDto,
    @Body() updateRequest: UpdateBankConnectionDto,
  ): Promise<BankConnectionResponse> {
    // ... existing implementation
  }

  @Delete(':connectionId')
  @ApiOperation({ summary: 'Delete a bank connection' })
  @ApiResponse({ status: 200, description: 'Bank connection deleted successfully' })
  @ApiResponse({ status: 404, description: 'Bank connection not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteBankConnection(@Param() params: BankConnectionByIdParamsDto): Promise<void> {
    // ... existing implementation
  }

  @Get(':connectionId/status')
  @ApiOperation({ summary: 'Get bank connection status' })
  @ApiResponse({ status: 200, description: 'Bank connection status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Bank connection not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBankConnectionStatus(
    @Param() params: BankConnectionByIdParamsDto,
  ): Promise<{ status: BankConnectionStatus; lastSync?: Date }> {
    // ... existing implementation
  }
}
```

### 5. User Controller

Update `user.controller.ts` with `@ApiTags` and `@ApiOperation` to provide metadata for your user-related endpoints.

```typescript
// splice-service/src/users/user.controller.ts
import { Body, Controller, ForbiddenException, Param, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserDto, UserParamsDto } from './dto';
import type { User } from './user.entity';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'The user has been successfully created.'})
  @ApiResponse({ status: 400, description: 'Bad Request.'})
  async create(@Body() createUserDto: CreateUserDto): Promise<{ user: User; apiKey: string }> {
    return await this.userService.create(createUserDto.username, createUserDto.email);
  }

  @Post(':uuid/revoke-api-keys')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all API keys for a user' })
  @ApiResponse({ status: 200, description: 'API keys revoked successfully.'})
  @ApiResponse({ status: 401, description: 'Unauthorized.'})
  @ApiResponse({ status: 403, description: 'Forbidden.'})
  async revokeApiKeys(@Param() params: UserParamsDto, @Request() req: { user: User }): Promise<{ message: string }> {
    if (req.user.uuid !== params.uuid) {
      throw new ForbiddenException('You can only revoke your own API keys');
    }

    await this.userService.revokeAllApiKeys(params.uuid);
    return { message: 'API keys revoked successfully' };
  }
}
```

### 6. Transactions Controller

Similarly, document your `transactions.controller.ts`:

```typescript
// splice-service/src/transactions/transcations.controller.ts
import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { ApiKeyType } from '@splice/api';
import { ApiKeyStoreService } from 'src/api-key-store/api-key-store.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import {
  GetSecretDto,
  GetTransactionsByAccountDto,
  GetTransactionsByConnectionDto,
  TransactionHeadersDto,
} from './dto';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly apiKeyStoreService: ApiKeyStoreService,
  ) {}

  @Get('by-account')
  @ApiOperation({ summary: 'Get transactions by account' })
  @ApiHeader({
    name: 'X-Secret',
    description: 'The secret returned when storing the API key',
    required: true,
  })
  async getByAccount(@Query() query: GetTransactionsByAccountDto, @Headers() headers: TransactionHeadersDto) {
    const authToken = await this.apiKeyStoreService.retrieveApiKey(
      query.userUuid,
      ApiKeyType.BITWARDEN,
      headers['X-Secret'],
    );
    return this.transactionsService.getTransactionsForAccount(query.accountName, authToken);
  }
}
```

### 3. DTOs

Add `@ApiProperty` to your DTOs to provide information about the request and response payloads.

```typescript
// splice-service/src/users/dto/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { CreateUserRequest } from '@splice/api';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto implements CreateUserRequest {
  @ApiProperty({ example: 'testuser', description: 'The username of the user' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  declare username: string;

  @ApiProperty({ example: 'user@example.com', description: 'The email of the user', required: false })
  @IsEmail()
  @IsOptional()
  declare email?: string;
}
```

## Phase 3: Accessing the OpenAPI Documentation

Once you've implemented these changes, you can run your application in development mode:

```bash
bun run dev
```

Then, navigate to `http://localhost:3000/api` in your browser to see the interactive Swagger UI for your API. The raw OpenAPI JSON specification will be available at `http://localhost:3000/api-json`.

This plan aligns with the "Comprehensive API documentation (OpenAPI/Swagger)" requirement mentioned in your `5-standardized-transaction-api.md` feature plan. By following these steps, you will have a solid foundation for documenting your API, which will be invaluable for both frontend developers and external consumers of your API.
