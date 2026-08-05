import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { CurrentCharacter } from '../../common/decorators/current-character.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequireCharacter } from '../../common/decorators/require-character.decorator';
import { CharacterGuard } from '../../common/guards/character.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { IAuthAccount, IAuthCharacter } from '../auth/interfaces/i-auth-request.interface';
import {
  CreateDecorationDto,
  DecorationsService,
  UpdateDecorationDto,
} from './decorations.service';

class AwardDecorationDto {
  @IsUUID()
  decorationId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

@Controller()
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class DecorationsController {
  constructor(private readonly decorationsService: DecorationsService) {}

  @Get('decorations')
  @Permissions('decorations.read')
  findAll() {
    return this.decorationsService.findAll();
  }

  @Get('decorations/:id')
  @Permissions('decorations.read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.decorationsService.findById(id);
  }

  @Post('decorations')
  @Permissions('decorations.manage')
  create(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Body() dto: CreateDecorationDto,
  ) {
    return this.decorationsService.create(dto, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Patch('decorations/:id')
  @Permissions('decorations.manage')
  update(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDecorationDto,
  ) {
    return this.decorationsService.update(id, dto, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Get('staff/:staffId/decorations')
  @Permissions('decorations.read')
  listForOfficer(@Param('staffId', ParseUUIDPipe) staffId: string) {
    return this.decorationsService.listForOfficer(staffId);
  }

  @Post('staff/:staffId/decorations')
  @Permissions('decorations.manage')
  award(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Body() dto: AwardDecorationDto,
  ) {
    return this.decorationsService.award(staffId, dto.decorationId, dto.notes, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Delete('officer-decorations/:id')
  @Permissions('decorations.manage')
  revoke(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.decorationsService.revoke(id, {
      accountId: account.id,
      characterId: character?.id,
    });
  }
}
