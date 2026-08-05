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
import { Public } from '../../common/decorators/public.decorator';
import { RequireCharacter } from '../../common/decorators/require-character.decorator';
import { CharacterGuard } from '../../common/guards/character.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { IAuthAccount, IAuthCharacter } from '../auth/interfaces/i-auth-request.interface';
import {
  CreateNewsArticleDto,
  NewsService,
  UpdateNewsArticleDto,
} from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Public()
  @Get('published')
  listPublished() {
    return this.newsService.listPublished();
  }

  @Public()
  @Get('published/:id')
  findPublished(@Param('id', ParseUUIDPipe) id: string) {
    return this.newsService.findPublishedById(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
  @RequireCharacter(true)
  @Permissions('news.manage')
  listAll() {
    return this.newsService.listAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
  @RequireCharacter(true)
  @Permissions('news.manage')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.newsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
  @RequireCharacter(true)
  @Permissions('news.manage')
  create(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Body() dto: CreateNewsArticleDto,
  ) {
    return this.newsService.create(dto, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
  @RequireCharacter(true)
  @Permissions('news.manage')
  update(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNewsArticleDto,
  ) {
    return this.newsService.update(id, dto, {
      accountId: account.id,
      characterId: character?.id,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
  @RequireCharacter(true)
  @Permissions('news.manage')
  remove(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter | null,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.newsService.remove(id, {
      accountId: account.id,
      characterId: character?.id,
    });
  }
}
