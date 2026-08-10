import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'node:path';
import appConfig from './app.config';
import databaseConfig from './database.config';
import discordConfig from './discord.config';
import jwtConfig from './jwt.config';
import { envValidationSchema } from './env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Always load api/.env even when the process cwd is the monorepo root.
      envFilePath: [
        join(process.cwd(), '.env'),
        join(process.cwd(), 'api', '.env'),
        join(__dirname, '..', '..', '.env'),
      ],
      load: [appConfig, databaseConfig, jwtConfig, discordConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),
  ],
})
export class AppConfigModule {}
