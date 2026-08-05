import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthProvider } from '@prisma/client';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { hashPassword, verifyPassword } from '../../common/security/password-hash';
import { PrismaService } from '../../database/prisma.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';
import { AccountsService } from './accounts.service';

export class UpdateMyUsernameDto {
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_]+$/)
  username!: string;
}

export class ChangeMyPasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}

@Injectable()
export class AccountsSelfService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly accountsService: AccountsService,
    private readonly auditService: AuditService,
  ) {}

  async updateUsername(
    accountId: string,
    dto: UpdateMyUsernameDto,
    actor: { characterId?: string | null },
  ) {
    const account = await this.accountsService.getByIdOrThrow(accountId);
    this.accountsService.assertAccountIsActive(account);

    const username = dto.username.trim().toLowerCase();
    if (!username) {
      throw new BadRequestException('Username is required');
    }

    if (username === account.username) {
      throw new BadRequestException('El nuevo nombre de usuario es igual al actual');
    }

    const existing = await this.accountsService.findByUsername(username);
    if (existing && existing.id !== accountId) {
      throw new ConflictException('Username is already registered');
    }

    const previousUsername = account.username;
    const shouldSyncDisplayName =
      !account.displayName || account.displayName === previousUsername;

    const updated = await this.prismaService.$transaction(async (tx) => {
      const next = await tx.account.update({
        where: { id: accountId },
        data: {
          username,
          displayName: shouldSyncDisplayName ? username : undefined,
        },
      });

      await tx.authIdentity.updateMany({
        where: {
          accountId,
          provider: AuthProvider.LOCAL,
        },
        data: { providerAccountId: username },
      });

      return next;
    });

    await this.auditService.create({
      actorAccountId: accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'accounts.username_changed',
      targetType: AUDIT_TARGET.ACCOUNT,
      targetId: accountId,
      metadata: {
        fromUsername: previousUsername,
        toUsername: updated.username,
        message: 'El usuario actualizó su nombre de usuario.',
      },
    });

    return {
      id: updated.id,
      username: updated.username,
      displayName: updated.displayName,
    };
  }

  async changePassword(
    accountId: string,
    dto: ChangeMyPasswordDto,
    actor: { characterId?: string | null },
  ) {
    const account = await this.accountsService.getByIdOrThrow(accountId);
    this.accountsService.assertAccountIsActive(account);

    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException('La nueva contraseña no puede ser igual a la actual');
    }

    const identity = await this.prismaService.authIdentity.findFirst({
      where: {
        accountId,
        provider: AuthProvider.LOCAL,
      },
    });

    if (!identity?.passwordHash) {
      throw new BadRequestException('Account has no local password identity');
    }

    const isCurrentValid = await verifyPassword(
      identity.passwordHash,
      dto.currentPassword,
    );
    if (!isCurrentValid) {
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }

    const reusesCurrent = await verifyPassword(identity.passwordHash, dto.newPassword);
    if (reusesCurrent) {
      throw new BadRequestException('La nueva contraseña no puede ser igual a la actual');
    }

    const passwordHash = await hashPassword(dto.newPassword);

    await this.prismaService.authIdentity.update({
      where: { id: identity.id },
      data: { passwordHash },
    });

    await this.auditService.create({
      actorAccountId: accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'accounts.password_changed',
      targetType: AUDIT_TARGET.ACCOUNT,
      targetId: accountId,
      metadata: {
        username: account.username,
        message: 'El usuario cambió su contraseña.',
      },
    });

    return { updated: true };
  }
}
