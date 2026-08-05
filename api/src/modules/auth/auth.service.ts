import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthProvider } from '@prisma/client';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { AccountsService } from '../accounts/accounts.service';
import { CharactersService } from '../characters/characters.service';
import { AUTH_EVENTS } from './constants/auth.constants';
import {
  IAuthProvider,
  IAuthProviderLoginInput,
  IAuthProviderRegisterInput,
} from './interfaces/i-auth-provider.interface';
import { LocalAuthProvider } from './providers/local-auth.provider';
import { ITokenPair, TokenService } from './token.service';

@Injectable()
export class AuthService {
  private readonly providers: Map<AuthProvider, IAuthProvider>;

  constructor(
    private readonly localAuthProvider: LocalAuthProvider,
    private readonly accountsService: AccountsService,
    private readonly charactersService: CharactersService,
    private readonly tokenService: TokenService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {
    this.providers = new Map<AuthProvider, IAuthProvider>([
      [AuthProvider.LOCAL, this.localAuthProvider],
    ]);
  }

  getProvider(provider: AuthProvider): IAuthProvider {
    const authProvider = this.providers.get(provider);

    if (!authProvider) {
      throw new BadRequestException(`Auth provider "${provider}" is not supported`);
    }

    return authProvider;
  }

  async registerLocal(
    input: IAuthProviderRegisterInput,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const provider = this.getProvider(AuthProvider.LOCAL);

    if (!provider.register) {
      throw new BadRequestException('LOCAL provider does not support registration');
    }

    const { accountId } = await provider.register(input);
    return this.createSession(accountId, meta);
  }

  async loginLocal(
    input: IAuthProviderLoginInput,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const provider = this.getProvider(AuthProvider.LOCAL);

    if (!provider.authenticate) {
      throw new BadRequestException('LOCAL provider does not support password login');
    }

    const { accountId } = await provider.authenticate(input);
    await this.accountsService.setActiveCharacter(accountId, null);
    return this.createSession(accountId, meta);
  }

  async refresh(
    refreshToken: string,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<ITokenPair & { account: unknown; character: unknown }> {
    const stored = await this.tokenService.findValidRefreshToken(refreshToken);

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.rotateSession(stored.accountId, refreshToken, meta);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokenService.revokeRefreshToken(refreshToken);
  }

  async getMe(accountId: string) {
    const account = await this.accountsService.getByIdOrThrow(accountId);
    this.accountsService.assertAccountIsActive(account);

    const character = account.activeCharacterId
      ? await this.charactersService.buildAuthContext(account.activeCharacterId, account.id)
      : null;

    return {
      account: {
        id: account.id,
        email: account.email,
        username: account.username,
        displayName: account.displayName,
        status: account.status,
        activeCharacterId: account.activeCharacterId,
      },
      character,
      permissions: character?.permissions ?? [],
      roles: character?.roles ?? [],
    };
  }

  async selectCharacter(accountId: string, characterId: string) {
    const character = await this.charactersService.buildAuthContext(characterId, accountId);
    await this.accountsService.setActiveCharacter(accountId, characterId);

    const access = await this.tokenService.issueAccessToken({
      accountId,
      characterId: character.id,
      roles: character.roles,
      permissions: character.permissions,
    });

    this.realtimeGateway.emitToAccount(accountId, AUTH_EVENTS.CHARACTER_CHANGED, {
      character,
      permissions: character.permissions,
      roles: character.roles,
    });

    return {
      ...access,
      account: {
        id: accountId,
        activeCharacterId: characterId,
      },
      character,
      permissions: character.permissions,
      roles: character.roles,
    };
  }

  private async createSession(
    accountId: string,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const account = await this.accountsService.getByIdOrThrow(accountId);
    this.accountsService.assertAccountIsActive(account);

    const character = account.activeCharacterId
      ? await this.charactersService.buildAuthContext(account.activeCharacterId, account.id)
      : null;

    const tokens = await this.tokenService.issueTokenPair({
      accountId: account.id,
      characterId: character?.id ?? null,
      roles: character?.roles ?? [],
      permissions: character?.permissions ?? [],
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
    });

    return {
      ...tokens,
      account: {
        id: account.id,
        email: account.email,
        username: account.username,
        displayName: account.displayName,
        status: account.status,
        activeCharacterId: account.activeCharacterId,
      },
      character,
      permissions: character?.permissions ?? [],
      roles: character?.roles ?? [],
    };
  }

  private async rotateSession(
    accountId: string,
    refreshToken: string,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const account = await this.accountsService.getByIdOrThrow(accountId);
    this.accountsService.assertAccountIsActive(account);

    const character = account.activeCharacterId
      ? await this.charactersService.buildAuthContext(account.activeCharacterId, account.id)
      : null;

    const tokens = await this.tokenService.rotateRefreshToken({
      refreshToken,
      accountId: account.id,
      characterId: character?.id ?? null,
      roles: character?.roles ?? [],
      permissions: character?.permissions ?? [],
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
    });

    return {
      ...tokens,
      account: {
        id: account.id,
        email: account.email,
        username: account.username,
        displayName: account.displayName,
        status: account.status,
        activeCharacterId: account.activeCharacterId,
      },
      character,
      permissions: character?.permissions ?? [],
      roles: character?.roles ?? [],
    };
  }
}
