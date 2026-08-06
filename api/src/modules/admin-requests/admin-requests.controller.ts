import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
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
import { AdminRequestsService } from './admin-requests.service';
import {
  AssignAdminRequestDto,
  CreateAdminRequestDto,
  CreateAdminRequestMessageDto,
  CreateAdminRequestNoteDto,
  SearchAdminRequestsDto,
  UpdateAdminRequestPriorityDto,
  UpdateAdminRequestStatusDto,
} from './dto/admin-request.dto';

@Controller('admin-requests')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class AdminRequestsController {
  constructor(private readonly adminRequestsService: AdminRequestsService) {}

  @Get('stats')
  @Permissions('admin-requests.read')
  getStats(
    @CurrentCharacter() character: IAuthCharacter,
    @Req() request: { user?: { permissions?: string[] } },
  ) {
    return this.adminRequestsService.getStats(
      character.id,
      request.user?.permissions ?? [],
    );
  }

  @Get('assignees/search')
  @Permissions('admin-requests.assign')
  searchAssignees(@Query('q') query = '') {
    return this.adminRequestsService.searchAssignees(query);
  }

  @Get()
  @Permissions('admin-requests.read')
  list(
    @CurrentCharacter() character: IAuthCharacter,
    @Req() request: { user?: { permissions?: string[] } },
    @Query() query: SearchAdminRequestsDto,
  ) {
    return this.adminRequestsService.list(
      character.id,
      request.user?.permissions ?? [],
      query,
    );
  }

  @Get(':id')
  @Permissions('admin-requests.read')
  getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentCharacter() character: IAuthCharacter,
    @Req() request: { user?: { permissions?: string[] } },
  ) {
    return this.adminRequestsService.getById(
      id,
      character.id,
      request.user?.permissions ?? [],
    );
  }

  @Post()
  @Permissions('admin-requests.create')
  create(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: CreateAdminRequestDto,
  ) {
    return this.adminRequestsService.create(dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Patch(':id/status')
  @Permissions('admin-requests.manage')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Req() request: { user?: { permissions?: string[] } },
    @Body() dto: UpdateAdminRequestStatusDto,
  ) {
    return this.adminRequestsService.updateStatus(id, dto, {
      accountId: account.id,
      characterId: character.id,
      permissions: request.user?.permissions ?? [],
    });
  }

  @Patch(':id/priority')
  @Permissions('admin-requests.manage')
  updatePriority(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Req() request: { user?: { permissions?: string[] } },
    @Body() dto: UpdateAdminRequestPriorityDto,
  ) {
    return this.adminRequestsService.updatePriority(id, dto, {
      accountId: account.id,
      characterId: character.id,
      permissions: request.user?.permissions ?? [],
    });
  }

  @Post(':id/assignments')
  @Permissions('admin-requests.assign')
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Req() request: { user?: { permissions?: string[] } },
    @Body() dto: AssignAdminRequestDto,
  ) {
    return this.adminRequestsService.assign(id, dto, {
      accountId: account.id,
      characterId: character.id,
      permissions: request.user?.permissions ?? [],
    });
  }

  @Post(':id/messages')
  @Permissions('admin-requests.read')
  addMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Req() request: { user?: { permissions?: string[] } },
    @Body() dto: CreateAdminRequestMessageDto,
  ) {
    return this.adminRequestsService.addMessage(id, dto, {
      accountId: account.id,
      characterId: character.id,
      permissions: request.user?.permissions ?? [],
    });
  }

  @Post(':id/notes')
  @Permissions('admin-requests.manage')
  addNote(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Req() request: { user?: { permissions?: string[] } },
    @Body() dto: CreateAdminRequestNoteDto,
  ) {
    return this.adminRequestsService.addInternalNote(id, dto, {
      accountId: account.id,
      characterId: character.id,
      permissions: request.user?.permissions ?? [],
    });
  }
}
