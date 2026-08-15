import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaActivityMiddleware } from './prisma-activity.middleware';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(PrismaActivityMiddleware).forRoutes('*');
  }
}
