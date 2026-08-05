import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { RanksController } from './ranks.controller';
import { RanksService } from './ranks.service';

@Module({
  imports: [AuditModule],
  controllers: [RanksController],
  providers: [RanksService],
  exports: [RanksService],
})
export class RanksModule {}
