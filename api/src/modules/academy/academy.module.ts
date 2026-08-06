import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { RolesModule } from '../roles/roles.module';
import { AcademyController } from './academy.controller';
import { AcademyService } from './academy.service';
import { ApplicationConfigurationsService } from './application-configurations.service';

@Module({
  imports: [AuditModule, NotificationsModule, RolesModule, PermissionsModule],
  controllers: [AcademyController],
  providers: [AcademyService, ApplicationConfigurationsService],
  exports: [AcademyService, ApplicationConfigurationsService],
})
export class AcademyModule {}
