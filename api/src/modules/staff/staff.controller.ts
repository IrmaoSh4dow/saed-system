import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DepartmentMembershipRole } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { CurrentCharacter } from '../../common/decorators/current-character.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequireCharacter } from '../../common/decorators/require-character.decorator';
import { CharacterGuard } from '../../common/guards/character.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { IAuthAccount, IAuthCharacter } from '../auth/interfaces/i-auth-request.interface';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffIdentityDto } from './dto/update-staff-identity.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffService } from './staff.service';

class AssignStaffDepartmentDto {
  @IsUUID()
  departmentId!: string;

  @IsOptional()
  @IsEnum(DepartmentMembershipRole)
  role?: DepartmentMembershipRole;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

@Controller('staff')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @Permissions('staff.read')
  findAll() {
    return this.staffService.findAll();
  }

  @Get('candidates')
  @Permissions('characters.search')
  searchCandidates(@Query('q') query = '') {
    return this.staffService.searchCandidates(query);
  }

  @Get(':id')
  @Permissions('staff.read')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentCharacter() character: IAuthCharacter | null,
  ) {
    return this.staffService.findOperationalById(id, {
      characterId: character?.id,
      permissions: character?.permissions ?? [],
    });
  }

  @Post()
  @Permissions('staff.create')
  create(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Body() dto: CreateStaffDto,
  ) {
    return this.staffService.create(dto, {
      accountId: account.id,
      characterId: character?.id,
      permissions: character?.permissions ?? [],
    });
  }

  @Patch(':id')
  @Permissions('staff.update')
  update(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.staffService.update(id, dto, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Patch(':id/identity')
  @Permissions('staff.identity')
  updateIdentity(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStaffIdentityDto,
  ) {
    return this.staffService.updateIdentity(id, dto, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Post(':id/departments')
  @Permissions('staff.update')
  assignDepartment(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignStaffDepartmentDto,
  ) {
    return this.staffService.assignDepartment(id, dto, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Delete(':id')
  @Permissions('staff.delete')
  retire(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.staffService.retire(id, {
      accountId: account.id,
      characterId: character?.id,
    });
  }
}

@Controller('staff-departments')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class StaffDepartmentsController {
  constructor(private readonly staffService: StaffService) {}

  @Delete(':id')
  @Permissions('staff.update')
  remove(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.staffService.removeDepartment(id, {
      accountId: account.id,
      characterId: character?.id,
    });
  }
}
