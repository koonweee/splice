# Plan: Comprehensive Controller Input Validation

## Overview
This document outlines a phased approach to implement robust, decorator-based input validation across **all controllers** in the `splice-service`. The goal is to enhance security and reliability by ensuring all incoming data (`@Body`, `@Query`, `@Param`) is well-formed and meets expected criteria before being processed by the services.

This refactoring will follow a consistent pattern, demonstrated by a concrete example, which should be applied to all relevant controllers in the monorepo.

**The Pattern:**
1.  **Define API Contracts**: In the `@splice/api` package, define the shape of requests using classes. This centralizes the API contract.
2.  **Implement Validation DTOs**: In `splice-service`, create DTO (Data Transfer Object) classes that extend the shared request classes and are decorated with `class-validator` rules.
3.  **Apply Globally**: Configure a global `ValidationPipe` in `main.ts` to automatically validate all incoming requests against these DTOs.
4.  **Refactor Controllers**: Update all controller methods to use the new, validated DTOs for their input.

## Phase 0: Foundation & Setup
This phase sets up the necessary tools for validation across the entire application.

- [ ] **Install dependencies in `splice-service`**:
    ```bash
    bun install class-validator class-transformer
    ```

- [ ] **Configure Global `ValidationPipe` in `splice-service/src/main.ts`**:
    Apply a global pipe to enable automatic validation for all endpoints. This is a one-time setup.
    ```typescript
    // splice-service/src/main.ts
    import { NestFactory } from '@nestjs/core';
    import { AppModule } from './app.module';
    import { ValidationPipe } from '@nestjs/common';

    async function bootstrap() {
      const app = await NestFactory.create(AppModule);

      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,            // Strip properties that do not have decorators
          forbidNonWhitelisted: true, // Throw an error if non-whitelisted values are provided
          transform: true,              // Automatically transform payloads to their DTO types
          transformOptions: {
            enableImplicitConversion: true, // Allow conversion of string params/queries
          },
        }),
      );

      await app.listen(3000);
    }
    bootstrap();
    ```

## Phase 1: Implement the Validation Pattern
This phase involves creating the necessary DTOs with validation rules for all controller inputs. The following example for creating a user should serve as the blueprint for all other controllers.

### Example: User Creation (`/users`)
**1. Define the Request Contract in `@splice/api`**

First, define the structure of the request in the shared `splice-api` package. This ensures the frontend and backend agree on the API contract.

```typescript
// splice-api/src/users/requests.ts
export class CreateUserRequest {
  username: string;
  email?: string;
}
```
*(Note: Ensure this is exported from the `index.ts` in the users directory and the root `index.ts`)*

**2. Create the Validation DTO in `splice-service`**

Next, in the `splice-service`, create a DTO class that implements the request contract and adds validation decorators.

```typescript
// splice-service/src/users/dto/create-user.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { CreateUserRequest } from '@splice/api';

export class CreateUserDto extends CreateUserRequest {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  declare username: string;

  @IsEmail()
  @IsOptional()
  declare email?: string;
}
```

This pattern should be repeated for every data input point in the application (e.g., creating bank connections, storing API keys, querying transactions).

## Phase 2: Refactor All Controllers
With the DTOs defined, refactor every controller to use them. The `ValidationPipe` configured in Phase 0 will handle the rest.

### Example: Refactoring `UserController`
The `create` method in `UserController` will be updated to use the new `CreateUserDto`.

**Before:**
```typescript
// splice-service/src/users/user.controller.ts
class CreateUserDto { // DTO defined locally
  username: string;
  email?: string;
}

@Controller('users')
export class UserController {
  //...
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    // ... no automatic validation
  }
}
```

**After:**
```typescript
// splice-service/src/users/user.controller.ts
import { CreateUserDto } from './dto/create-user.dto'; // <-- Import the validated DTO

@Controller('users')
export class UserController {
  //...
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    // NestJS has already validated the DTO by this point.
    // If validation fails, a 400 Bad Request is automatically sent.
    return await this.userService.create(createUserDto.username, createUserDto.email);
  }
}
```

**Task**: Apply this refactoring pattern to **all controllers** that receive input, including `ApiKeyStoreController`, `BankConnectionController`, and `TransactionsController`. Create corresponding DTOs for their `@Body`, `@Query`, and `@Param` inputs.

## Phase 3: Testing & Validation
The final phase is to ensure the validation works as expected and to add test coverage for it.

- [ ] **Unit Tests**:
    - For each controller's unit tests, add cases to verify that invalid data would be caught. While the pipe is tested at the E2E level, these tests can assert that the correct DTOs are being used.

- [ ] **E2E Tests**:
    - This is the most critical part of testing validation. For each endpoint:
        - Add tests that send malformed requests (e.g., invalid UUIDs, missing required fields, incorrect data types, extra fields not defined in the DTO).
        - Assert that the API responds with a `400 Bad Request` status.
        - Assert that the error response body contains a meaningful message indicating which validation rule failed.
    - Update the existing `test/e2e/bank-management.e2e-spec.ts` and create new specs where necessary to cover these failure cases.
