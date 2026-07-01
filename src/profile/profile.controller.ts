import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser, CurrentUserData } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpsertProfileDto } from './dto';
import { ProfileService } from './profile.service';

@ApiTags('Perfil')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  /** Retorna o perfil do usuário e suas metas diárias mais recentes. */
  @Get()
  @ApiOkResponse({
    description: 'Perfil e metas diárias do usuário (null se ainda não preenchido).',
  })
  get(@CurrentUser() user: CurrentUserData) {
    return this.profile.get(user.userId);
  }

  /** Cria/atualiza o perfil e recalcula as metas (calorias, macros, água). */
  @Put()
  @ApiOkResponse({ description: 'Perfil salvo e metas recalculadas.' })
  @ApiBadRequestResponse({ description: 'Dados inválidos.' })
  upsert(@CurrentUser() user: CurrentUserData, @Body() dto: UpsertProfileDto) {
    return this.profile.upsert(user.userId, dto);
  }
}
