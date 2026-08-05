import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ArrayMinSize, IsArray, IsString } from 'class-validator';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { CurrentCharacter } from '../../common/decorators/current-character.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequireCharacter } from '../../common/decorators/require-character.decorator';
import { CharacterGuard } from '../../common/guards/character.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { IAuthAccount, IAuthCharacter } from '../auth/interfaces/i-auth-request.interface';
import { RolesService } from './roles.service';

class SetCharacterRolesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  roleSlugs!: string[];
}

@Controller('roles')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('roles.read')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('characters/:characterId')
  @Permissions('roles.read')
  getCharacterRoles(@Param('characterId', ParseUUIDPipe) characterId: string) {
    return this.rolesService.getCharacterRoles(characterId);
  }

  @Put('characters/:characterId')
  @Permissions('roles.assign')
  setCharacterRoles(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('characterId', ParseUUIDPipe) characterId: string,
    @Body() dto: SetCharacterRolesDto,
  ) {
    return this.rolesService.setCharacterRoles(characterId, dto.roleSlugs, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Get(':slug')
  @Permissions('roles.read')
  findBySlug(@Param('slug') slug: string) {
    return this.rolesService.findBySlug(slug);
  }
}
