# Backend Code Standards & Patterns

This document outlines the backend architecture, patterns, and code standards used in the LeadSend monorepo. Following these guidelines ensures consistent development across backend services.

## Architecture Overview

The backend services in LeadSend are built using NestJS, a progressive Node.js framework that provides an excellent foundation for building scalable and maintainable server-side applications.

### Technology Stack

- **Framework**: [NestJS](https://nestjs.com/)
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport.js
- **API Documentation**: Swagger/OpenAPI
- **Messaging**: Kafka/SQS
- **Logging**: Winston with custom formatters
- **Testing**: Jest

## Project Structure

Backend services follow a consistent structure:

```
service/
├── src/
│   ├── app/
│   │   ├── app.controller.ts
│   │   ├── app.module.ts
│   │   └── app.service.ts
│   ├── modules/
│   │   ├── feature1/
│   │   │   ├── feature1.controller.ts
│   │   │   ├── feature1.module.ts
│   │   │   ├── feature1.service.ts
│   │   │   ├── dto/
│   │   │   └── interfaces/
│   │   └── feature2/
│   ├── main.ts
│   └── assets/
├── Dockerfile
├── jest.config.ts
└── pm2.config.js
```

## Module Structure

Each feature should be organized as a separate module with the following components:

1. **Module Class**: Defines the scope of the feature and its dependencies
2. **Controller Class**: Handles HTTP requests and defines API endpoints
3. **Service Class**: Contains business logic
4. **DTOs**: Define data transfer objects for request/response validation
5. **Entities**: Define database models (typically stored in the shared storage library)
6. **Interfaces**: Define TypeScript interfaces for the module

## Code Standards

### Module Definition

```typescript
import { Module } from '@nestjs/common';
import { StorageModule } from '@leadsend/storage';
import { SecurityModule } from '@leadsend/security';
import { FeatureController } from './feature.controller';
import { FeatureService } from './feature.service';

@Module({
  imports: [StorageModule, SecurityModule], // External dependencies first
  controllers: [FeatureController], // Controllers
  providers: [FeatureService], // Services and providers
  exports: [FeatureService], // What to export (if needed)
})
export class FeatureModule {}
```

### Controller Definition

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FeatureService } from './feature.service';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { Feature } from './entities/feature.entity';

@ApiTags('Features') // Swagger tag
@Controller('features') // Route prefix
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new feature' })
  @ApiResponse({ status: 201, description: 'Feature created.', type: Feature })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async create(@Body() createFeatureDto: CreateFeatureDto): Promise<Feature> {
    return this.featureService.create(createFeatureDto);
  }

  // Other endpoints...
}
```

### Service Definition

```typescript
import { Injectable } from '@nestjs/common';
import { Repository } from '@leadsend/storage';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { Feature } from './entities/feature.entity';

@Injectable()
export class FeatureService {
  constructor(private readonly repository: Repository) {}

  async create(createFeatureDto: CreateFeatureDto): Promise<Feature> {
    // Business logic goes here
    return this.repository.create(createFeatureDto);
  }

  // Other methods...
}
```

### DTO Definition

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateFeatureDto {
  @ApiProperty({
    description: 'The name of the feature',
    example: 'New Feature',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The description of the feature',
    example: 'This is a new feature',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
```

## Shared Libraries

The backend heavily relies on shared libraries for common functionality:

- **@leadsend/storage**: Database entities and repositories
- **@leadsend/security**: Authentication and authorization
- **@leadsend/logging**: Logging functionality
- **@leadsend/messaging**: Message queuing and events
- **@leadsend/queue**: Queue management

Always import and reuse these libraries instead of reimplementing their functionality.

## Authentication & Authorization

1. Use the provided `AuthGuard` from `@leadsend/security` for authentication
2. Use the `AuthorizationGuard` for role-based access control
3. Apply `@AllowUnauthorizedRequest()` decorator for public endpoints
4. Use `@SkipAuthorizationCheck()` for endpoints that need authentication but not authorization

## Error Handling

1. Use NestJS exception filters for consistent error handling
2. Throw appropriate HTTP exceptions from the `@nestjs/common` package
3. All errors should be logged with proper context
4. Use the `ExceptionLogFilter` from `@leadsend/logging` for automatic error logging

## Logging

1. Use the `logger` from `@leadsend/logging` for all logging
2. Log appropriate information at appropriate levels:
   - `error`: For errors that need attention
   - `warn`: For warnings that might need attention
   - `info`: For important application events
   - `debug`: For debugging information
   - `verbose`: For detailed information

## Database Access

1. Use TypeORM repositories for database operations
2. Define entities in the `@leadsend/storage` library
3. Use migrations for database schema changes
4. Follow naming conventions for database objects:
   - Tables: snake_case, plural (e.g., `user_profiles`)
   - Columns: snake_case (e.g., `first_name`)

## API Design

1. Follow RESTful principles for API design
2. Use meaningful resource names (nouns) for endpoints
3. Use appropriate HTTP methods:
   - `GET`: Retrieve resources
   - `POST`: Create resources
   - `PUT`: Update resources completely
   - `PATCH`: Update resources partially
   - `DELETE`: Remove resources
4. Use query parameters for filtering, sorting, and pagination
5. Document all endpoints with Swagger annotations

## Testing

1. Write unit tests for services and controllers
2. Use Jest for testing framework
3. Mock external dependencies
4. Aim for high test coverage of critical paths
5. Write integration tests for critical workflows

## Performance Considerations

1. Use pagination for large data sets
2. Use caching where appropriate
3. Optimize database queries with proper indexing
4. Use asynchronous processing for long-running tasks

## Security Considerations

1. Always validate input data with DTOs and class-validator
2. Use parameterized queries to prevent SQL injection
3. Set proper CORS settings in production
4. Use HTTPS in production
5. Don't expose sensitive information in logs or responses

By adhering to these standards, we ensure that the backend code remains maintainable, secure, and consistent across the entire application.
