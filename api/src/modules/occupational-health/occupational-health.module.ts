import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PatientsModule } from '../patients/patients.module';
import { LspdController } from './lspd.controller';
import { MedicalLeavesService } from './medical-leaves.service';
import { MedicalRecordAccessService } from './medical-record-access.service';
import { OccupationalHealthController } from './occupational-health.controller';
import { OccupationalHealthService } from './occupational-health.service';
import { PsychotechnicalEvaluationsService } from './psychotechnical-evaluations.service';

@Module({
  imports: [
    AuditModule,
    NotificationsModule,
    PermissionsModule,
    forwardRef(() => PatientsModule),
  ],
  controllers: [OccupationalHealthController, LspdController],
  providers: [
    PsychotechnicalEvaluationsService,
    MedicalLeavesService,
    MedicalRecordAccessService,
    OccupationalHealthService,
  ],
  exports: [
    PsychotechnicalEvaluationsService,
    MedicalLeavesService,
    MedicalRecordAccessService,
    OccupationalHealthService,
  ],
})
export class OccupationalHealthModule {}
