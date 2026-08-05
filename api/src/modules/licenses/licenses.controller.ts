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
  CreateLicenseDto,
  LicensesService,
  UpdateLicenseDto,
} from './licenses.service';

class AssignLicenseDto {
  @IsUUID()
  licenseId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

@Controller()
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Get('licenses')
  @Permissions('licenses.read')
  findAll() {
    return this.licensesService.findAll();
  }

  @Get('licenses/:id')
  @Permissions('licenses.read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.licensesService.findById(id);
  }

  @Post('licenses')
  @Permissions('licenses.manage')
  create(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Body() dto: CreateLicenseDto,
  ) {
    return this.licensesService.create(dto, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Patch('licenses/:id')
  @Permissions('licenses.manage')
  update(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLicenseDto,
  ) {
    return this.licensesService.update(id, dto, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Delete('licenses/:id')
  @Permissions('licenses.manage')
  remove(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.licensesService.remove(id, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Get('staff/:staffId/licenses')
  @Permissions('licenses.read')
  listForOfficer(@Param('staffId', ParseUUIDPipe) staffId: string) {
    return this.licensesService.listForOfficer(staffId);
  }

  @Post('staff/:staffId/licenses')
  @Permissions('licenses.manage')
  assign(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Body() dto: AssignLicenseDto,
  ) {
    return this.licensesService.assign(staffId, dto.licenseId, dto.notes, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Delete('officer-licenses/:id')
  @Permissions('licenses.manage')
  revoke(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.licensesService.revoke(id, {
      accountId: account.id,
      characterId: character?.id,
    });
  }
}
