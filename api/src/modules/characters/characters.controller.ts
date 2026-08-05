import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequireCharacter } from '../../common/decorators/require-character.decorator';
import { CharacterGuard } from '../../common/guards/character.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { imageUploadInterceptor } from '../../common/storage/image-upload.interceptor';
import { AccountsService } from '../accounts/accounts.service';
import type { IAuthAccount } from '../auth/interfaces/i-auth-request.interface';
import { CharactersService } from './characters.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { ListCharactersDirectoryDto } from './dto/list-characters-directory.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { UpdateMyCharacterDto } from './dto/update-my-character.dto';

@Controller('characters')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(false)
export class CharactersController {
  constructor(
    private readonly charactersService: CharactersService,
    private readonly accountsService: AccountsService,
  ) {}

  @Get()
  list(@CurrentAccount() account: IAuthAccount) {
    return this.charactersService.findByAccountId(account.id);
  }

  @Get('workplaces')
  listWorkplaces() {
    return this.charactersService.listWorkplaces();
  }

  @Get('directory')
  @RequireCharacter(true)
  @Permissions('characters.search')
  directory(@Query() query: ListCharactersDirectoryDto) {
    return this.charactersService.findDirectory(query);
  }

  @Get('search')
  @RequireCharacter(true)
  @Permissions('characters.search')
  search(@Query('q') query = '') {
    return this.charactersService.searchAll(query);
  }

  @Get('active/permissions')
  async getActivePermissions(@CurrentAccount() account: IAuthAccount) {
    const current = await this.accountsService.getByIdOrThrow(account.id);
    return this.charactersService.getActivePermissions(account.id, current.activeCharacterId);
  }

  @Get('admin/:id')
  @RequireCharacter(true)
  @Permissions('characters.search')
  getAdmin(@Param('id', ParseUUIDPipe) characterId: string) {
    return this.charactersService.getByIdAdmin(characterId);
  }

  @Get(':id')
  getOne(
    @CurrentAccount() account: IAuthAccount,
    @Param('id', ParseUUIDPipe) characterId: string,
  ) {
    return this.charactersService.getByIdForAccount(characterId, account.id);
  }

  @Post()
  create(@CurrentAccount() account: IAuthAccount, @Body() dto: CreateCharacterDto) {
    return this.charactersService.create(account.id, dto);
  }

  @Patch('me')
  @RequireCharacter(true)
  updateMe(
    @CurrentAccount() account: IAuthAccount,
    @Body() dto: UpdateMyCharacterDto,
  ) {
    return this.accountsService.getByIdOrThrow(account.id).then((current) =>
      this.charactersService.updateActiveProfile(
        account.id,
        current.activeCharacterId,
        dto,
      ),
    );
  }

  @Post(':id/avatar')
  @UseInterceptors(imageUploadInterceptor('file'))
  uploadAvatar(
    @CurrentAccount() account: IAuthAccount,
    @Param('id', ParseUUIDPipe) characterId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    return this.charactersService.uploadAvatar(characterId, account.id, file);
  }

  @Patch(':id')
  update(
    @CurrentAccount() account: IAuthAccount,
    @Param('id', ParseUUIDPipe) characterId: string,
    @Body() dto: UpdateCharacterDto,
  ) {
    return this.charactersService.update(characterId, account.id, dto);
  }
}
