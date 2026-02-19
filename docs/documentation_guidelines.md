# Fintrack Documentation Guidelines

This document defines the standard documentation patterns for the Fintrack project. Consistent documentation ensures that the codebase remains maintainable and accessible for all developers.

## Scope

These guidelines apply to:

- **Functions** (Utility, helper, and standalone).
- **Services** (NestJS services, business logic layers).
- **Controllers** (API Gateway and Microservices).

**Note**: Modules are excluded from mandatory documentation requirements.

---

## 1. Services and General Functions

All services and general functions must use **JSDoc** formatting.

### Required Tags

- `@description`: A concise explanation of what the function/service does.
- `@async`: (If applicable) Indicates the function returns a Promise.
- `@public` / `@private`: Indicates visibility.
- `@param {Type} name`: Parameter type and name. Include a brief description after the name.
- `@returns {Type}`: The return type. Include a brief description.

### Example

```typescript
/**
 * @description Hashes a plain text password using bcrypt
 *
 * @async
 * @public
 * @param {string} password Plain text password to hash
 * @returns {Promise<string>} The resulting hashed password
 */
async hashPassword(password: string): Promise<string> {
  // logic...
}
```

---

## 2. API Gateway Controllers

API Gateway controllers use a **stylized header pattern** instead of JSDoc for individual methods to maintain compatibility with Swagger decorators and keep the code clean.

### Required Formatting

- **Separator**: Use `// ================================================================`.
- **Method Header**: Use `//. Description of the endpoint`.
- **Swagger Decorators**: Always include `@ApiOperation`, `@ApiBody`, and relevant `@ApiResponse` tags.

### Example

```typescript
// ================================================================
//. Register a new User via local Credentials
// ================================================================
@Post('register')
@ApiOperation({
  summary: 'Register User',
  description: 'Register new or existing user with local credentials',
})
@ApiResponse({ status: 201, description: 'Success' })
async register(@Body() body: RegisterUserDto) {
  // logic...
}
```

---

## 3. Microservice Controllers

Microservice controllers (e.g., in `auth_service`) use standard **JSDoc** for their methods, similar to services.

### Example

```typescript
/**
 * @description Microservice handler for user registration
 *
 * @async
 * @public
 * @param {RegisterReq} request The gRPC request object
 * @returns {Promise<RegisterRes>} The gRPC response
 */
register(request: RegisterReq): Promise<RegisterRes> {
  // logic...
}
```

---

## 4. Error Handling Pattern

The project follows a standardized error handling pattern to ensure consistent error responses across all services.

### Microservices (gRPC)

Errors in microservices must be thrown using `RpcException` with a specific gRPC status code.

- **JSDoc**: Use the `@throws {RpcException}` tag to document expected errors.

```typescript
/**
 * @description Register a new user
 * @throws {RpcException} ALREADY_EXISTS if the email is taken
 */
async register(data: RegisterReq): Promise<RegisterRes> {
  if (userExists) {
    throw new RpcException({
      code: status.ALREADY_EXISTS,
      message: 'User already exists',
    });
  }
}
```

### Gateway Services (API Gateway)

Services in the API Gateway should document errors using their **HTTP equivalence** (e.g., `ConflictException` instead of `RpcException`), as these services are responsible for preparing data for the public REST/GraphQL API.

```typescript
/**
 * @description Register a new user
 * @throws {ConflictException} If the email is taken (mapped from Rpc ALREADY_EXISTS)
 * @throws {RequestTimeoutException} If the microservice times out
 */
async register(data: RegisterUserDto): Promise<RegisterRes> {
  // logic calling microservice...
}
```

### API Gateway (HTTP)

The API Gateway transforms microservice errors into standard HTTP responses using the `StandardResponse` interface.

- **Formatting**: Endpoints should document error responses using Swagger `@ApiResponse` decorators.

```typescript
@ApiResponse({
  status: HttpStatus.CONFLICT,
  description: 'User already exists',
  schema: {
    example: {
      success: false,
      statusCode: HttpStatus.CONFLICT,
      data: null,
      message: 'User already exists',
    },
  },
})
```
