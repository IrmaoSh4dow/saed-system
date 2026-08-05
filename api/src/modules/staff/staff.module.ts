import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { RolesModule } from '../roles/roles.module';
import { LandingController } from './landing.controller';
import { StaffDepartmentsController, StaffController } from './staff.controller';
import { StaffService } from './staff.service';

@Module({
  imports: [RolesModule, AuditModule],
  controllers: [StaffController, StaffDepartmentsController, LandingController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
