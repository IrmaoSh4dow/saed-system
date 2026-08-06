import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { InstitutionalPaymentsController } from './institutional-payments.controller';
import { InstitutionalPaymentsService } from './institutional-payments.service';

@Module({
  imports: [AuditModule],
  controllers: [InstitutionalPaymentsController],
  providers: [InstitutionalPaymentsService],
  exports: [InstitutionalPaymentsService],
})
export class InstitutionalPaymentsModule {}
