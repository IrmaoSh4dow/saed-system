import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Account, AccountStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private readonly prismaService: PrismaService) {}

  findById(id: string) {
    return this.prismaService.account.findUnique({
      where: { id },
      include: {
        identities: true,
        activeCharacter: true,
      },
    });
  }

  /**
   * Lean account projection used by JWT validation on every request.
   * Avoids loading identities / activeCharacter graphs for auth hot path.
   */
  findAuthAccountById(id: string) {
    return this.prismaService.account.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        status: true,
        activeCharacterId: true,
      },
    });
  }

  async getByIdOrThrow(id: string) {
    const account = await this.findById(id);

    if (!account) {
      throw new NotFoundException('Account was not found');
    }

    return account;
  }

  async getAuthAccountByIdOrThrow(id: string) {
    const account = await this.findAuthAccountById(id);

    if (!account) {
      throw new NotFoundException('Account was not found');
    }

    return account;
  }

  findByEmail(email: string) {
    return this.prismaService.account.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  findByUsername(username: string) {
    return this.prismaService.account.findUnique({
      where: { username: username.toLowerCase() },
    });
  }

  create(data: Prisma.AccountCreateInput) {
    if (!data.username || typeof data.username !== 'string') {
      throw new Error('Account username is required');
    }

    return this.prismaService.account.create({
      data: {
        ...data,
        email: data.email ? data.email.toLowerCase() : undefined,
        username: data.username.toLowerCase(),
      },
    });
  }

  assertAccountIsActive(account: Pick<Account, 'status'>): void {
    if (account.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }
  }

  setActiveCharacter(accountId: string, characterId: string | null) {
    return this.prismaService.account.update({
      where: { id: accountId },
      data: { activeCharacterId: characterId },
    });
  }
}
