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
import { ComplaintsController } from './complaints.controller';
import { ComplaintsService } from './complaints.service';

@WebSocketGateway({
  cors: {
    origin: parseCorsOrigins(process.env.FRONTEND_URL),
    credentials: true,
  },
})
export class ComplaintsGateway {
  @SubscribeMessage('complaints:join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { room?: string; caseNumber?: number },
  ) {
    const room =
      body.room ??
      (body.caseNumber != null ? `complaint-${body.caseNumber}` : null);
    if (!room) {
      return { ok: false };
    }
    void client.join(room);
    return { ok: true, room };
  }

  @SubscribeMessage('complaints:leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { room?: string; caseNumber?: number },
  ) {
    const room =
      body.room ??
      (body.caseNumber != null ? `complaint-${body.caseNumber}` : null);
    if (!room) {
      return { ok: false };
    }
    void client.leave(room);
    return { ok: true, room };
  }
}

@Module({
  imports: [PermissionsModule, NotificationsModule, RealtimeModule],
  controllers: [ComplaintsController],
  providers: [ComplaintsService, ComplaintsGateway],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}
