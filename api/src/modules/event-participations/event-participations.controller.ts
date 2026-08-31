import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
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
  CreateEventParticipationDto,
  SearchEventParticipationsDto,
} from './dto/event-participation.dto';
import { EventParticipationsService } from './event-participations.service';

@Controller('event-participations')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class EventParticipationsController {
  constructor(private readonly eventParticipationsService: EventParticipationsService) {}

  @Get()
  @Permissions('event-participations.read')
  list(@Query() query: SearchEventParticipationsDto) {
    return this.eventParticipationsService.list(query, query.limit);
  }

  @Get(':id')
  @Permissions('event-participations.read')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventParticipationsService.getById(id);
  }

  @Post()
  @Permissions('event-participations.create')
  create(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: CreateEventParticipationDto,
  ) {
    return this.eventParticipationsService.create(character.id, account.id, dto);
  }

  @Delete(':id')
  @Permissions('event-participations.manage')
  remove(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.eventParticipationsService.remove(id, account.id, character.id);
  }
}
