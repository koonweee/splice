# Engineering Plan: Revocable JWT API Keys

This plan outlines the implementation of a revocable, non-expiring JWT-based API key system for the `splice-service`.

---

### **Phase 0: Prerequisites**

**Objective**: Ensure the environment is correctly configured with a secret for signing JWTs.

1.  **Update Environment Configuration**
    * **File**: `splice-service/.env` (and create/update `.env.example` to include the new variable).
    * **Task**: Add a `JWT_SECRET` variable to your environment files. This secret is critical for securing the API keys.
    * **Action**: Generate a strong, random secret and add it. You can use the following command to generate a suitable key:
        ```bash
        openssl rand -hex 32
        ```
    * **Example `.env` entry**:
        ```
        JWT_SECRET=your_generated_super_strong_and_secret_key_here
        ```

---

### **Phase 1: API Key Generation**

**Objective**: Update the `users` module to generate versioned, non-expiring JWTs upon user creation.

1.  **Update `User` Entity**
    * **File**: `splice-service/src/users/user.entity.ts`
    * **Task**: Add a `tokenVersion` column to the `User` entity. This integer will be used to invalidate old tokens.
    * **Details**: Use `@Column({ type: 'int', default: 1 })`.

2.  **Update `JwtModule` Configuration**
    * **File**: `splice-service/src/users/users.module.ts`
    * **Task**: Configure `JwtModule` to sign tokens *without* an expiration date by removing the `signOptions` or ensuring `expiresIn` is not set.

3.  **Update `UserService`**
    * **File**: `splice-service/src/users/user.service.ts`
    * **Task**: In the `create` method, include the user's `tokenVersion` in the JWT payload.
    * **Details**: The payload should look like `{ sub: user.uuid, ver: user.tokenVersion }`. The method should return both the new `user` and the `apiKey`.

4.  **Update `UserController`**
    * **File**: `splice-service/src/users/user.controller.ts`
    * **Task**: Ensure the `create` endpoint returns the `apiKey` to the client in the response body alongside the user object.

---

### **Phase 2: API Key Validation**

**Objective**: Implement a new authentication module and strategy to validate the versioned JWTs.

1.  **Create `AuthModule`**
    * **Task**: Generate a new `auth` module (`src/auth`) containing `auth.module.ts` and `jwt.strategy.ts`.
    * **Details**: The module should import `PassportModule` and `UsersModule`. Register it in the root `AppModule`.

2.  **Implement `JwtStrategy`**
    * **File**: `src/auth/jwt.strategy.ts`
    * **Task**: Create a Passport strategy that validates the JWT payload against the `tokenVersion` in the database.
    * **Key Logic**:
        * Extract the token from the `Authorization: Bearer <token>` header.
        * In the `validate(payload)` method, find the user by `payload.sub`.
        * **Crucially**, throw an `UnauthorizedException` if `user.tokenVersion !== payload.ver`.
        * Return the `user` object on success.

---

### **Phase 3: API Key Revocation**

**Objective**: Create a secure endpoint to invalidate all of a user's existing API keys.

1.  **Add Revocation Logic to `UserService`**
    * **File**: `splice-service/src/users/user.service.ts`
    * **Task**: Add a new method `revokeAllApiKeys(uuid: string)`.
    * **Details**: This method will use the TypeORM `repository.increment()` function to increment the `tokenVersion` for the specified user.

2.  **Create Revocation Endpoint in `UserController`**
    * **File**: `splice-service/src/users/user.controller.ts`
    * **Task**: Create a new `POST` endpoint, e.g., `/users/:uuid/revoke-api-keys`.
    * **Security**:
        * Protect the endpoint with `@UseGuards(AuthGuard('jwt'))`.
        * Ensure the authenticated user from the request (`req.user`) can only revoke their own keys by comparing `req.user.uuid` with the `:uuid` parameter. Throw a `ForbiddenException` if they don't match.

---

### **Phase 4: Secure Endpoints**

**Objective**: Apply the new authentication strategy to protect service resources.

1.  **Apply `AuthGuard` to Controllers**
    * **Files**: `transactions.controller.ts`, `bank-connection.controller.ts`, and any other controllers requiring authentication.
    * **Task**: Add the `@UseGuards(AuthGuard('jwt'))` decorator at the controller level. This will protect all routes within the decorated controllers, requiring a valid, non-revoked API key for access.
