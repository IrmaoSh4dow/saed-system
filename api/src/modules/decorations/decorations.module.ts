import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DecorationsController } from './decorations.controller';
import { DecorationsService } from './decorations.service';

@Module({
  imports: [AuditModule],
  controllers: [DecorationsController],
  providers: [DecorationsService],
  exports: [DecorationsService],
})
export class DecorationsModule {}
