import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser, CurrentUserData } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateGroupDto, JoinGroupDto } from './dto';
import { GroupsService } from './groups.service';

@ApiTags('Grupos')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  /** Cria um grupo de gamificação e gera um código de convite. */
  @Post()
  @ApiBadRequestResponse({ description: 'Dados inválidos.' })
  create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateGroupDto) {
    return this.groups.create(user.userId, dto);
  }

  /** Entra em um grupo usando o código de convite. */
  @Post('join')
  @ApiBadRequestResponse({ description: 'Código inválido.' })
  @ApiNotFoundResponse({ description: 'Nenhum grupo encontrado para o código informado.' })
  join(@CurrentUser() user: CurrentUserData, @Body() dto: JoinGroupDto) {
    return this.groups.join(user.userId, dto);
  }

  /** Lista os grupos dos quais o usuário participa. */
  @Get()
  mine(@CurrentUser() user: CurrentUserData) {
    return this.groups.myGroups(user.userId);
  }

  /** Ranking do grupo por XP (o usuário precisa ser membro). */
  @Get(':id/ranking')
  @ApiParam({ name: 'id', description: 'ID do grupo.', example: 'clx123abc' })
  @ApiNotFoundResponse({ description: 'Grupo não encontrado ou usuário não é membro.' })
  ranking(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.groups.ranking(user.userId, id);
  }

  /** Exclui um grupo (somente o criador). */
  @Delete(':id')
  @ApiParam({ name: 'id', description: 'ID do grupo a ser excluído.', example: 'clx123abc' })
  @ApiNotFoundResponse({ description: 'Grupo não encontrado ou usuário não é o criador.' })
  remove(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.groups.remove(user.userId, id);
  }
}
