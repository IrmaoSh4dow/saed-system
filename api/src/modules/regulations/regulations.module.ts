import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { RegulationsController } from './regulations.controller';
import { RegulationsService } from './regulations.service';

@Module({
  imports: [AuditModule],
  controllers: [RegulationsController],
  providers: [RegulationsService],
  exports: [RegulationsService],
})
export class RegulationsModule {}
