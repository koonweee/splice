import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that do not have decorators
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted values are provided
      transform: true, // Automatically transform payloads to their DTO types
      transformOptions: {
        enableImplicitConversion: true, // Allow conversion of string params/queries
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Splice API')
    .setDescription("An open-source, self-hosted, and extensible alternative to Plaid's transaction API.")
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // Scalar reference https://guides.scalar.com/scalar/scalar-api-references/integrations/nestjs (like swagger)
  app.use(
    '/api',
    apiReference({
      content: document,
    }),
  );

  await app.listen(3000);
}
bootstrap();
