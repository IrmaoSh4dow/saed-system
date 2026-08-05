import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccountStatus, AuthProvider, Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { hashPassword } from '../../common/security/password-hash';
import { PrismaService } from '../../database/prisma.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';

export class ListAccountsDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class ResetAccountPasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

const characterAdminInclude = {
  rank: true,
  occupations: {
    where: { isActive: true },
    orderBy: [{ isPrimary: 'desc' as const }, { createdAt: 'desc' as const }],
  },
  staffProfile: {
    include: {
      rank: true,
      department: true,
    },
  },
} satisfies Prisma.CharacterInclude;

@Injectable()
export class AccountsAdminService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(dto: ListAccountsDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 20;
    const q = dto.q?.trim();

    const where: Prisma.AccountWhereInput = q
      ? {
          OR: [
            { username: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { displayName: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};

    const [total, accounts] = await this.prismaService.$transaction([
      this.prismaService.account.count({ where }),
      this.prismaService.account.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { characters: true } },
        },
      }),
    ]);

    return {
      items: accounts.map((account) => this.toAccountSummary(account)),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getById(
    id: string,
    actor: { accountId: string; characterId?: string | null },
  ) {
    const account = await this.prismaService.account.findUnique({
      where: { id },
      include: {
        characters: {
          include: characterAdminInclude,
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Account was not found');
    }

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'accounts.view',
      targetType: AUDIT_TARGET.ACCOUNT,
      targetId: account.id,
      metadata: {
        username: account.username,
        message: `Se consultó la cuenta ${account.username}`,
      },
    });

    return {
      ...this.toAccountSummary(account),
      characters: account.characters.map((character) => this.toCharacterSummary(character)),
    };
  }

  async resetPassword(
    id: string,
    dto: ResetAccountPasswordDto,
    actor: { accountId: string; characterId?: string | null },
  ) {
    const account = await this.prismaService.account.findUnique({
      where: { id },
    });
    if (!account) {
      throw new NotFoundException('Account was not found');
    }

    const identity = await this.prismaService.authIdentity.findFirst({
      where: {
        accountId: id,
        provider: AuthProvider.LOCAL,
      },
    });

    if (!identity) {
      throw new BadRequestException('Account has no local password identity');
    }

    const passwordHash = await hashPassword(dto.password);

    await this.prismaService.authIdentity.update({
      where: { id: identity.id },
      data: { passwordHash },
    });

    await this.prismaService.refreshToken.deleteMany({
      where: { accountId: id },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'accounts.password_reset',
      targetType: AUDIT_TARGET.ACCOUNT,
      targetId: account.id,
      metadata: {
        username: account.username,
        message: `Se restableció la contraseña de la cuenta ${account.username}`,
      },
    });

    return { reset: true, accountId: id };
  }

  private toAccountSummary(account: {
    id: string;
    email: string | null;
    username: string;
    displayName: string | null;
    status: AccountStatus;
    createdAt: Date;
    updatedAt?: Date;
    _count?: { characters: number };
  }) {
    return {
      id: account.id,
      email: account.email,
      username: account.username,
      displayName: account.displayName,
      status: account.status,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt?.toISOString() ?? null,
      characterCount: account._count?.characters ?? undefined,
    };
  }

  private toCharacterSummary(
    character: Prisma.CharacterGetPayload<{ include: typeof characterAdminInclude }>,
  ) {
    const primaryOccupation =
      character.occupations.find((item) => item.isPrimary) ?? character.occupations[0] ?? null;
    const officer = character.staffProfile;

    return {
      id: character.id,
      firstName: character.firstName,
      lastName: character.lastName,
      status: character.status,
      rankLabel: officer?.rank?.name ?? character.rank?.name ?? null,
      departmentName: officer?.department?.name ?? null,
      employeeNumber: officer?.employeeNumber ?? null,
      workplace: primaryOccupation
        ? {
            organization: primaryOccupation.organization,
            position: primaryOccupation.position,
          }
        : null,
    };
  }
}
