import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequireCharacter } from '../../common/decorators/require-character.decorator';
import { CharacterGuard } from '../../common/guards/character.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import type { IAuthAccount } from './interfaces/i-auth-request.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto, @Req() request: Request) {
    return this.authService.registerLocal(
      {
        username: dto.username,
        password: dto.password,
        displayName: dto.displayName,
      },
      {
        userAgent: request.headers['user-agent'],
        ipAddress: request.ip,
      },
    );
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.authService.loginLocal(
      {
        identifier: dto.identifier,
        password: dto.password,
      },
      {
        userAgent: request.headers['user-agent'],
        ipAddress: request.ip,
      },
    );
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto, @Req() request: Request) {
    return this.authService.refresh(dto.refreshToken, {
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
    });
  }

  @Public()
  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken);
    return { loggedOut: true };
  }

  @UseGuards(JwtAuthGuard, CharacterGuard)
  @RequireCharacter(false)
  @Get('me')
  me(@CurrentAccount() account: IAuthAccount) {
    return this.authService.getMe(account.id);
  }

  @UseGuards(JwtAuthGuard, CharacterGuard)
  @RequireCharacter(false)
  @Post('characters/:id/select')
  selectCharacter(@CurrentAccount() account: IAuthAccount, @Param('id') characterId: string) {
    return this.authService.selectCharacter(account.id, characterId);
  }
}
