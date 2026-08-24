import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AccountsService } from '../../accounts/accounts.service';
import { CharactersService } from '../../characters/characters.service';
import { AuthContextCacheService } from '../../../common/auth-context/auth-context-cache.service';
import { IAuthRequestUser } from '../interfaces/i-auth-request.interface';
import { IJwtPayload } from '../interfaces/i-jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly accountsService: AccountsService,
    private readonly charactersService: CharactersService,
    private readonly authContextCacheService: AuthContextCacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
    });
  }

  async validate(payload: IJwtPayload): Promise<IAuthRequestUser> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }

    const cached = this.authContextCacheService.get(payload.sub, payload.characterId);
    if (cached) {
      return cached;
    }

    const account = await this.accountsService.getAuthAccountByIdOrThrow(payload.sub);
    this.accountsService.assertAccountIsActive(account);

    const character = payload.characterId
      ? await this.charactersService.buildRequestAuthContext(payload.characterId, account.id)
      : null;

    const authUser: IAuthRequestUser = {
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
    };

    this.authContextCacheService.set(payload.sub, payload.characterId, authUser);
    return authUser;
  }
}
