import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser, CurrentUserData } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMealDto, CreateWaterDto, CreateWorkoutDto } from './dto';
import { LogsService } from './logs.service';

@ApiTags('Registros')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('logs')
export class LogsController {
  constructor(private readonly logs: LogsService) {}

  /** Registra consumo de água (+5 XP). */
  @Post('water')
  water(@CurrentUser() user: CurrentUserData, @Body() dto: CreateWaterDto) {
    return this.logs.addWater(user.userId, dto);
  }

  /** Registra uma refeição com macros (+10 XP). */
  @Post('meal')
  meal(@CurrentUser() user: CurrentUserData, @Body() dto: CreateMealDto) {
    return this.logs.addMeal(user.userId, dto);
  }

  /** Registra um treino (+25 XP). */
  @Post('workout')
  workout(@CurrentUser() user: CurrentUserData, @Body() dto: CreateWorkoutDto) {
    return this.logs.addWorkout(user.userId, dto);
  }

  /** Resumo do dia atual: água, calorias, macros e treinos. */
  @Get('today')
  today(@CurrentUser() user: CurrentUserData) {
    return this.logs.today(user.userId);
  }
}
