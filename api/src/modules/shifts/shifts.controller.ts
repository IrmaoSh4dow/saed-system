import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentCharacter } from '../../common/decorators/current-character.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequireCharacter } from '../../common/decorators/require-character.decorator';
import { CharacterGuard } from '../../common/guards/character.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { IAuthCharacter } from '../auth/interfaces/i-auth-request.interface';
import { ClockInShiftDto, ClockOutShiftDto } from './dto/shift.dto';
import { ShiftsService } from './shifts.service';

@Controller('shifts')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get('current')
  @Permissions('shifts.read')
  getCurrent(@CurrentCharacter() character: IAuthCharacter) {
    return this.shiftsService.getCurrent(character.id);
  }

  @Get('stats')
  @Permissions('shifts.read')
  getStats(@CurrentCharacter() character: IAuthCharacter) {
    return this.shiftsService.getStats(character.id);
  }

  @Get('history')
  @Permissions('shifts.read')
  listHistory(
    @CurrentCharacter() character: IAuthCharacter,
    @Query('limit') limit?: string,
  ) {
    const parsed = Number.parseInt(limit ?? '30', 10);
    return this.shiftsService.listHistory(
      character.id,
      Number.isFinite(parsed) ? parsed : 30,
    );
  }

  @Post('clock-in')
  @Permissions('shifts.clock')
  clockIn(
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: ClockInShiftDto,
  ) {
    return this.shiftsService.clockIn(character.id, dto);
  }

  @Post('clock-out')
  @Permissions('shifts.clock')
  clockOut(
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: ClockOutShiftDto,
  ) {
    return this.shiftsService.clockOut(character.id, dto);
  }
}
