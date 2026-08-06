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
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { CurrentCharacter } from '../../common/decorators/current-character.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequireCharacter } from '../../common/decorators/require-character.decorator';
import { CharacterGuard } from '../../common/guards/character.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { IAuthAccount, IAuthCharacter } from '../auth/interfaces/i-auth-request.interface';
import {
  CreateAgreementDto,
  SearchAgreementsDto,
  UpdateAgreementDto,
} from './dto/agreement.dto';
import { AgreementsService } from './agreements.service';

@Controller('agreements')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  @Get('dashboard')
  @Permissions('agreements.read')
  getDashboard() {
    return this.agreementsService.getDashboard();
  }

  @Get('directory')
  @Permissions('agreements.read')
  listDirectory(
    @Query('q') q?: string,
    @Query('onlyAffiliated') onlyAffiliated?: string,
  ) {
    return this.agreementsService.listEstablishmentDirectory({
      q,
      onlyAffiliated: onlyAffiliated === 'true' || onlyAffiliated === '1',
    });
  }

  @Get()
  @Permissions('agreements.read')
  list(@Query() query: SearchAgreementsDto) {
    return this.agreementsService.list(query);
  }

  @Get(':id')
  @Permissions('agreements.read')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.agreementsService.getById(id);
  }

  @Post()
  @Permissions('agreements.manage')
  create(
    @Body() dto: CreateAgreementDto,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.agreementsService.create(dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Patch(':id')
  @Permissions('agreements.manage')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAgreementDto,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.agreementsService.update(id, dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Post(':id/activate')
  @Permissions('agreements.manage')
  activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.agreementsService.activate(id, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Post(':id/deactivate')
  @Permissions('agreements.manage')
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.agreementsService.deactivate(id, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Delete(':id')
  @Permissions('agreements.manage')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.agreementsService.remove(id, {
      accountId: account.id,
      characterId: character.id,
    });
  }
}
