import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AccountsService } from '../../accounts/accounts.service';
import { CharactersService } from '../../characters/characters.service';
import { IAuthRequestUser } from '../interfaces/i-auth-request.interface';
import { IJwtPayload } from '../interfaces/i-jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly accountsService: AccountsService,
    private readonly charactersService: CharactersService,
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

    const account = await this.accountsService.getByIdOrThrow(payload.sub);
    this.accountsService.assertAccountIsActive(account);

    const character = payload.characterId
      ? await this.charactersService.buildAuthContext(payload.characterId, account.id)
      : null;

    const authAccount = {
      id: account.id,
      email: account.email,
      username: account.username,
      displayName: account.displayName,
      status: account.status,
      activeCharacterId: account.activeCharacterId,
    };

    return {
      account: authAccount,
      character,
      permissions: character?.permissions ?? [],
    };
  }
}
