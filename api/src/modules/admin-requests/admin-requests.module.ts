import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Module } from '@nestjs/common';
import { Socket } from 'socket.io';
import { parseCorsOrigins } from '../../common/utils/cors-origins.util';
import { RealtimeModule } from '../../realtime/realtime.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { StaffRatingsModule } from '../staff-ratings/staff-ratings.module';
import { AdminRequestsController } from './admin-requests.controller';
import { AdminRequestsService } from './admin-requests.service';

@WebSocketGateway({
  cors: {
    origin: parseCorsOrigins(process.env.FRONTEND_URL),
    credentials: true,
  },
})
export class AdminRequestsGateway {
  @SubscribeMessage('admin-requests:join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { room?: string; requestNumber?: number },
  ) {
    const room =
      body.room ??
      (body.requestNumber != null ? `admin-request-${body.requestNumber}` : null);
    if (!room) return { ok: false };
    void client.join(room);
    return { ok: true, room };
  }

  @SubscribeMessage('admin-requests:leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { room?: string; requestNumber?: number },
  ) {
    const room =
      body.room ??
      (body.requestNumber != null ? `admin-request-${body.requestNumber}` : null);
    if (!room) return { ok: false };
    void client.leave(room);
    return { ok: true, room };
  }
}

@Module({
  imports: [
    PermissionsModule,
    NotificationsModule,
    RealtimeModule,
    AuditModule,
    StaffRatingsModule,
  ],
  controllers: [AdminRequestsController],
  providers: [AdminRequestsService, AdminRequestsGateway],
  exports: [AdminRequestsService],
})
export class AdminRequestsModule {}
