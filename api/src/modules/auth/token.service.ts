import { createHash, randomBytes } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtSignOptions } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { IJwtPayload } from './interfaces/i-jwt-payload.interface';

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async issueAccessToken(params: {
    accountId: string;
    characterId: string | null;
    roles: string[];
    permissions: string[];
  }): Promise<{ accessToken: string; tokenType: 'Bearer'; expiresIn: string }> {
    const accessExpiresIn = this.configService.get<string>('jwt.accessExpiresIn', '15m');

    const payload: IJwtPayload = {
      sub: params.accountId,
      characterId: params.characterId,
      roles: params.roles,
      permissions: params.permissions,
      type: 'access',
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: accessExpiresIn,
    } as JwtSignOptions);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: accessExpiresIn,
    };
  }

  async issueTokenPair(params: {
    accountId: string;
    characterId: string | null;
    roles: string[];
    permissions: string[];
    userAgent?: string;
    ipAddress?: string;
  }): Promise<ITokenPair> {
    const accessExpiresIn = this.configService.get<string>('jwt.accessExpiresIn', '15m');
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn', '7d');

    const payload: IJwtPayload = {
      sub: params.accountId,
      characterId: params.characterId,
      roles: params.roles,
      permissions: params.permissions,
      type: 'access',
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: accessExpiresIn,
    } as JwtSignOptions);

    const refreshToken = this.createOpaqueToken();
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = this.resolveExpirationDate(refreshExpiresIn);

    await this.prismaService.refreshToken.create({
      data: {
        accountId: params.accountId,
        tokenHash,
        expiresAt,
        userAgent: params.userAgent,
        ipAddress: params.ipAddress,
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: accessExpiresIn,
    };
  }

  async findValidRefreshToken(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const existing = await this.prismaService.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!existing || existing.revokedAt || existing.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    return existing;
  }

  async rotateRefreshToken(params: {
    refreshToken: string;
    accountId: string;
    characterId: string | null;
    roles: string[];
    permissions: string[];
    userAgent?: string;
    ipAddress?: string;
  }): Promise<ITokenPair> {
    const tokenHash = this.hashToken(params.refreshToken);
    const existing = await this.prismaService.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (
      !existing ||
      existing.accountId !== params.accountId ||
      existing.revokedAt ||
      existing.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const nextPair = await this.issueTokenPair(params);
    const nextHash = this.hashToken(nextPair.refreshToken);
    const replacement = await this.prismaService.refreshToken.findUnique({
      where: { tokenHash: nextHash },
    });

    await this.prismaService.refreshToken.update({
      where: { id: existing.id },
      data: {
        revokedAt: new Date(),
        replacedById: replacement?.id,
      },
    });

    return nextPair;
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const existing = await this.prismaService.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!existing || existing.revokedAt) {
      return;
    }

    await this.prismaService.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllAccountTokens(accountId: string): Promise<void> {
    await this.prismaService.refreshToken.updateMany({
      where: {
        accountId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private createOpaqueToken(): string {
    return randomBytes(48).toString('base64url');
  }

  private resolveExpirationDate(expiresIn: string): Date {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);

    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + amount * multipliers[unit]);
  }
}
