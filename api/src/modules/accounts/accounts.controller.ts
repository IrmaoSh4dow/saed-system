import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { CurrentCharacter } from '../../common/decorators/current-character.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequireCharacter } from '../../common/decorators/require-character.decorator';
import { CharacterGuard } from '../../common/guards/character.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { IAuthAccount, IAuthCharacter } from '../auth/interfaces/i-auth-request.interface';
import {
  AccountsAdminService,
  ListAccountsDto,
  ResetAccountPasswordDto,
} from './accounts-admin.service';

@Controller('accounts')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class AccountsController {
  constructor(private readonly accountsAdminService: AccountsAdminService) {}

  @Get()
  @Permissions('accounts.manage')
  list(@Query() dto: ListAccountsDto) {
    return this.accountsAdminService.list(dto);
  }

  @Get(':id')
  @Permissions('accounts.manage')
  getOne(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.accountsAdminService.getById(id, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Patch(':id/password')
  @Permissions('accounts.manage')
  resetPassword(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetAccountPasswordDto,
  ) {
    return this.accountsAdminService.resetPassword(id, dto, {
      accountId: account.id,
      characterId: character?.id,
    });
  }
}
