import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { CurrentCharacter } from '../../common/decorators/current-character.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { IAuthAccount, IAuthCharacter } from '../auth/interfaces/i-auth-request.interface';
import {
  AccountsSelfService,
  ChangeMyPasswordDto,
  UpdateMyUsernameDto,
} from './accounts-self.service';

/**
 * Self-service account credentials. Uses JWT account only — never accepts another account id.
 */
@Controller('accounts/me')
@UseGuards(JwtAuthGuard)
export class AccountsSelfController {
  constructor(private readonly accountsSelfService: AccountsSelfService) {}

  @Patch('username')
  updateUsername(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Body() dto: UpdateMyUsernameDto,
  ) {
    return this.accountsSelfService.updateUsername(account.id, dto, {
      characterId: character?.id,
    });
  }

  @Patch('password')
  changePassword(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Body() dto: ChangeMyPasswordDto,
  ) {
    return this.accountsSelfService.changePassword(account.id, dto, {
      characterId: character?.id,
    });
  }
}
