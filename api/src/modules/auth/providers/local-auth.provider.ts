import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthProvider } from '@prisma/client';
import { hashPassword, verifyPassword } from '../../../common/security/password-hash';
import { PrismaService } from '../../../database/prisma.service';
import { AccountsService } from '../../accounts/accounts.service';
import {
  IAuthProvider,
  IAuthProviderLoginInput,
  IAuthProviderRegisterInput,
} from '../interfaces/i-auth-provider.interface';

@Injectable()
export class LocalAuthProvider implements IAuthProvider {
  readonly provider = AuthProvider.LOCAL;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly accountsService: AccountsService,
  ) {}

  async register(input: IAuthProviderRegisterInput): Promise<{ accountId: string }> {
    const username = input.username.trim().toLowerCase();

    const existingUsername = await this.accountsService.findByUsername(username);
    if (existingUsername) {
      throw new ConflictException('Username is already registered');
    }

    const passwordHash = await hashPassword(input.password);

    const account = await this.prismaService.account.create({
      data: {
        email: null,
        username,
        displayName: input.displayName?.trim() || username,
        identities: {
          create: {
            provider: AuthProvider.LOCAL,
            providerAccountId: username,
            passwordHash,
          },
        },
      },
    });

    return { accountId: account.id };
  }

  async authenticate(input: IAuthProviderLoginInput): Promise<{ accountId: string }> {
    const identifier = input.identifier.trim().toLowerCase();

    const account = await this.accountsService.findByUsername(identifier);

    if (!account) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.accountsService.assertAccountIsActive(account);

    const identity = await this.prismaService.authIdentity.findFirst({
      where: {
        accountId: account.id,
        provider: AuthProvider.LOCAL,
      },
    });

    if (!identity?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await verifyPassword(identity.passwordHash, input.password);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { accountId: account.id };
  }
}
