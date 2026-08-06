import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CharactersModule } from '../characters/characters.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { EmploymentChangeController } from './employment-change.controller';
import { EmploymentChangeService } from './employment-change.service';

@Module({
  imports: [AuditModule, NotificationsModule, PermissionsModule, CharactersModule],
  controllers: [EmploymentChangeController],
  providers: [EmploymentChangeService],
  exports: [EmploymentChangeService],
})
export class EmploymentChangeModule {}
