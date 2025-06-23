import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  // Set global prefix first
  app.setGlobalPrefix('api');

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
      'bearerAuth', // This is the security scheme name
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Keep token after page refresh
    },
  });

  app.enableCors({
    credentials: true,
    origin: true,
  });
  app.use(cookieParser());
  // app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.KAFKA,
  //   options: {
  //     client: {
  //       clientId: process.env.KAFKA_CLIENT_ID,
  //       brokers: [process.env.KAFKA_BROKERS],
  //     },
  //     producer: {
  //       allowAutoTopicCreation: true,
  //       idempotent: false,
  //     },
  //     consumer: {
  //       groupId: process.env.KAFKA_ZALO_MESSAGE_CONSUMER,
  //     },
  //   },
  // });

  // try {
  //   await app.startAllMicroservices();
  //   console.log('✅ Kafka microservice started successfully1231231');
  // } catch (error) {
  //   console.error('❌ Failed to start Kafka microservice:', error);
  // }
  await app.listen(process.env.PORT || 8080);
  console.log('Server is running on port:', process.env.PORT || 8080);
  console.log(
    'Swagger docs available at: http://localhost:' +
      (process.env.PORT || 8080) +
      '/api/docs',
  );
}
bootstrap();
