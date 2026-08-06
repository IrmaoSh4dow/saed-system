import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { IncentivesController } from './incentives.controller';
import { IncentivesService } from './incentives.service';

@Module({
  imports: [AuditModule],
  controllers: [IncentivesController],
  providers: [IncentivesService],
  exports: [IncentivesService],
})
export class IncentivesModule {}
