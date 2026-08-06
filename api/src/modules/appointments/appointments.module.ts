import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Module } from '@nestjs/common';
import { Socket } from 'socket.io';
import { parseCorsOrigins } from '../../common/utils/cors-origins.util';
import { PermissionsModule } from '../permissions/permissions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../../realtime/realtime.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@WebSocketGateway({
  cors: {
    origin: parseCorsOrigins(process.env.FRONTEND_URL),
    credentials: true,
  },
})
export class AppointmentsGateway {
  @SubscribeMessage('appointments:join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { room?: string; caseNumber?: number },
  ) {
    const room =
      body.room ??
      (body.caseNumber != null ? `appointment-${body.caseNumber}` : null);
    if (!room) {
      return { ok: false };
    }
    void client.join(room);
    return { ok: true, room };
  }

  @SubscribeMessage('appointments:leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { room?: string; caseNumber?: number },
  ) {
    const room =
      body.room ??
      (body.caseNumber != null ? `appointment-${body.caseNumber}` : null);
    if (!room) {
      return { ok: false };
    }
    void client.leave(room);
    return { ok: true, room };
  }
}

@Module({
  imports: [PermissionsModule, NotificationsModule, RealtimeModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsGateway],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
