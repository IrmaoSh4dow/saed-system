import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { parseCorsOrigins } from '../common/utils/cors-origins.util';
import { IJwtPayload } from '../modules/auth/interfaces/i-jwt-payload.interface';

interface ISocketAuthData {
  accountId?: string;
  characterId?: string | null;
}

@WebSocketGateway({
  cors: {
    origin: parseCorsOrigins(process.env.FRONTEND_URL),
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(): void {
    this.logger.log('Socket.IO gateway initialized');
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);

      if (!token) {
        this.logger.debug(`Client connected without auth: ${client.id}`);
        return;
      }

      const payload = await this.jwtService.verifyAsync<IJwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('jwt.secret'),
      });

      if (payload.type !== 'access') {
        client.disconnect(true);
        return;
      }

      await client.join(`account:${payload.sub}`);

      if (payload.characterId) {
        await client.join(`character:${payload.characterId}`);
      }

      const socketData = client.data as ISocketAuthData;
      socketData.accountId = payload.sub;
      socketData.characterId = payload.characterId;
      this.logger.debug(`Client authenticated: ${client.id} account:${payload.sub}`);
    } catch {
      this.logger.debug(`Client rejected (invalid token): ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  emitToAccount(accountId: string, event: string, payload: unknown): void {
    this.server.to(`account:${accountId}`).emit(event, payload);
  }

  emitToCharacter(characterId: string, event: string, payload: unknown): void {
    this.server.to(`character:${characterId}`).emit(event, payload);
  }

  emitToRoom(room: string, event: string, payload: unknown): void {
    this.server.to(room).emit(event, payload);
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth as { token?: unknown };
    if (typeof auth.token === 'string' && auth.token.length > 0) {
      return auth.token;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice('Bearer '.length);
    }

    return null;
  }
}
