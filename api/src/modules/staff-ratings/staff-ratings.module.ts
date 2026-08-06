import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StaffRatingsController } from './staff-ratings.controller';
import { StaffRatingsService } from './staff-ratings.service';

@Module({
  imports: [AuditModule, NotificationsModule],
  controllers: [StaffRatingsController],
  providers: [StaffRatingsService],
  exports: [StaffRatingsService],
})
export class StaffRatingsModule {}
