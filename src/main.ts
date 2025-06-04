import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix first
  app.setGlobalPrefix('api');

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('mi9 API')
    .setDescription('API documentation for mi9.io')
    .setVersion('1.0')
    .addBearerAuth() // If you use JWT
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // Add api prefix to swagger

  app.enableCors({
    credentials: true,
    origin: true,
  });

  await app.listen(process.env.PORT || 8080);
  console.log('Server is running on port:', process.env.PORT || 8080);
  console.log('Swagger docs available at: http://localhost:' + (process.env.PORT || 8080) + '/api/docs');
}
bootstrap();
