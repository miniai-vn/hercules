import { BullRootModuleOptions } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

export const getRedisConfig = (
  configService: ConfigService,
): BullRootModuleOptions => {
  const host = configService.get<string>('REDIS_HOST', 'localhost');
  const port = configService.get<number>('REDIS_PORT', 6379);
  const password = configService.get<string>('REDIS_PASSWORD');

  return {
    connection: {
      host,
      port,
      password: password || undefined,
    },
  };
};
