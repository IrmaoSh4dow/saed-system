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
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { CurrentCharacter } from '../../common/decorators/current-character.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequireCharacter } from '../../common/decorators/require-character.decorator';
import { CharacterGuard } from '../../common/guards/character.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { IAuthAccount, IAuthCharacter } from '../auth/interfaces/i-auth-request.interface';
import { CreateRankDto } from './dto/create-rank.dto';
import { UpdateRankDto } from './dto/update-rank.dto';
import { RanksService } from './ranks.service';

@Controller('ranks')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(false)
export class RanksController {
  constructor(private readonly ranksService: RanksService) {}

  @Get()
  findAllActive() {
    return this.ranksService.findAllActive();
  }

  @Get('admin/all')
  @RequireCharacter(true)
  @Permissions('ranks.read')
  findAllAdmin() {
    return this.ranksService.findAll();
  }

  @Get(':id')
  @Permissions('ranks.read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ranksService.findById(id);
  }

  @Post()
  @RequireCharacter(true)
  @Permissions('ranks.create')
  create(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Body() dto: CreateRankDto,
  ) {
    return this.ranksService.create(dto, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Patch(':id')
  @RequireCharacter(true)
  @Permissions('ranks.update')
  update(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRankDto,
  ) {
    return this.ranksService.update(id, dto, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Delete(':id')
  @RequireCharacter(true)
  @Permissions('ranks.delete')
  remove(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ranksService.remove(id, {
      accountId: account.id,
      characterId: character?.id,
    });
  }
}
