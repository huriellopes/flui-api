import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser, CurrentUserData } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VisionService } from '../vision/vision.service';
import { AnalyzeMealPhotoDto, CreateMealDto, CreateWaterDto, CreateWorkoutDto } from './dto';
import { LogsService } from './logs.service';

@ApiTags('Registros')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
@UseGuards(JwtAuthGuard)
@Controller('logs')
export class LogsController {
  constructor(
    private readonly logs: LogsService,
    private readonly vision: VisionService,
  ) {}

  /** Registra consumo de água (+5 XP). */
  @Post('water')
  @ApiBadRequestResponse({ description: 'Dados inválidos.' })
  water(@CurrentUser() user: CurrentUserData, @Body() dto: CreateWaterDto) {
    return this.logs.addWater(user.userId, dto);
  }

  /** Registra uma refeição com macros (+10 XP). */
  @Post('meal')
  @ApiBadRequestResponse({ description: 'Dados inválidos.' })
  meal(@CurrentUser() user: CurrentUserData, @Body() dto: CreateMealDto) {
    return this.logs.addMeal(user.userId, dto);
  }

  /** Registra um treino (+25 XP). */
  @Post('workout')
  @ApiBadRequestResponse({ description: 'Dados inválidos.' })
  workout(@CurrentUser() user: CurrentUserData, @Body() dto: CreateWorkoutDto) {
    return this.logs.addWorkout(user.userId, dto);
  }

  /**
   * Estima os macros a partir de uma foto do prato. NÃO registra nada — o app
   * usa o retorno para pré-preencher o formulário de refeição. É uma estimativa
   * para orientação, não um valor exato.
   */
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post('analyze-meal-photo')
  @ApiOkResponse({ description: 'Estimativa de prato e macros a partir da foto.' })
  @ApiBadRequestResponse({ description: 'Imagem inválida.' })
  @ApiTooManyRequestsResponse({ description: 'Muitas análises — tente em instantes.' })
  @ApiServiceUnavailableResponse({ description: 'Provedor de visão não configurado.' })
  analyzeMealPhoto(@Body() dto: AnalyzeMealPhotoDto) {
    return this.vision.analyzeMeal(dto.imageBase64, dto.imageMime);
  }

  /** Resumo do dia atual: água, calorias, macros e treinos. */
  @Get('today')
  today(@CurrentUser() user: CurrentUserData) {
    return this.logs.today(user.userId);
  }
}
