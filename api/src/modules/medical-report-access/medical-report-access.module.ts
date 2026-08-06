import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MedicalReportAccessController } from './medical-report-access.controller';
import { MedicalReportAccessService } from './medical-report-access.service';

@Module({
  imports: [AuditModule, NotificationsModule],
  controllers: [MedicalReportAccessController],
  providers: [MedicalReportAccessService],
  exports: [MedicalReportAccessService],
})
export class MedicalReportAccessModule {}
