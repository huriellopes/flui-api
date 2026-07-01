import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { CurrentUser, CurrentUserData } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMealDto, CreateWaterDto, CreateWorkoutDto } from './dto';
import { LogsService } from './logs.service';

@UseGuards(JwtAuthGuard)
@Controller('logs')
export class LogsController {
  constructor(private readonly logs: LogsService) {}

  @Post('water')
  water(@CurrentUser() user: CurrentUserData, @Body() dto: CreateWaterDto) {
    return this.logs.addWater(user.userId, dto);
  }

  @Post('meal')
  meal(@CurrentUser() user: CurrentUserData, @Body() dto: CreateMealDto) {
    return this.logs.addMeal(user.userId, dto);
  }

  @Post('workout')
  workout(@CurrentUser() user: CurrentUserData, @Body() dto: CreateWorkoutDto) {
    return this.logs.addWorkout(user.userId, dto);
  }

  @Get('today')
  today(@CurrentUser() user: CurrentUserData) {
    return this.logs.today(user.userId);
  }
}
