import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  const config = new DocumentBuilder()
    .setTitle('MiniAI API')
    .setDescription('API documentation for mi9.io')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        name: 'Authorization',
        description: 'Enter your Bearer token',
      },
      'bearerAuth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.enableCors({
    credentials: true,
    origin: true,
  });
  app.use(cookieParser());

  await app.listen(process.env.PORT || 8080);
  console.log('Server is running on port:', process.env.PORT || 8080);
  console.log(
    'Swagger docs available at: http://localhost:' +
      (process.env.PORT || 8080) +
      '/api/docs',
  );
}
bootstrap();
