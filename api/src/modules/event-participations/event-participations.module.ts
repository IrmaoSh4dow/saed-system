import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { EventParticipationsController } from './event-participations.controller';
import { EventParticipationsService } from './event-participations.service';

@Module({
  imports: [AuditModule],
  controllers: [EventParticipationsController],
  providers: [EventParticipationsService],
  exports: [EventParticipationsService],
})
export class EventParticipationsModule {}
