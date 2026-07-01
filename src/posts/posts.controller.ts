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
import { CreateCommentDto, CreatePostDto } from './dto';
import { PostsService } from './posts.service';

@ApiTags('Feed')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
@UseGuards(JwtAuthGuard)
@Controller()
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  /** Cria um post no feed do grupo (foto opcional + descrição). */
  @Post('groups/:groupId/posts')
  @ApiParam({ name: 'groupId', description: 'ID do grupo onde o post será publicado.', example: 'clx123abc' })
  @ApiBadRequestResponse({ description: 'Dados inválidos.' })
  @ApiNotFoundResponse({ description: 'Grupo não encontrado ou usuário não é membro.' })
  create(
    @CurrentUser() user: CurrentUserData,
    @Param('groupId') groupId: string,
    @Body() dto: CreatePostDto,
  ) {
    return this.posts.create(user.userId, groupId, dto);
  }

  /** Lista os posts do grupo (mais recentes primeiro). */
  @Get('groups/:groupId/posts')
  @ApiParam({ name: 'groupId', description: 'ID do grupo.', example: 'clx123abc' })
  @ApiNotFoundResponse({ description: 'Grupo não encontrado ou usuário não é membro.' })
  list(@CurrentUser() user: CurrentUserData, @Param('groupId') groupId: string) {
    return this.posts.list(user.userId, groupId);
  }

  /** Exclui um post (somente o autor). */
  @Delete('posts/:id')
  @ApiParam({ name: 'id', description: 'ID do post.', example: 'clx456def' })
  @ApiNotFoundResponse({ description: 'Post não encontrado ou usuário não é o autor.' })
  remove(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.posts.remove(user.userId, id);
  }

  /** Curte/descurte um post (toggle). */
  @Post('posts/:id/like')
  @ApiParam({ name: 'id', description: 'ID do post.', example: 'clx456def' })
  @ApiNotFoundResponse({ description: 'Post não encontrado.' })
  like(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.posts.toggleLike(user.userId, id);
  }

  /** Lista os comentários de um post. */
  @Get('posts/:id/comments')
  @ApiParam({ name: 'id', description: 'ID do post.', example: 'clx456def' })
  @ApiNotFoundResponse({ description: 'Post não encontrado.' })
  comments(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.posts.listComments(user.userId, id);
  }

  /** Adiciona um comentário. */
  @Post('posts/:id/comments')
  @ApiParam({ name: 'id', description: 'ID do post.', example: 'clx456def' })
  @ApiBadRequestResponse({ description: 'Dados inválidos.' })
  @ApiNotFoundResponse({ description: 'Post não encontrado.' })
  addComment(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.posts.addComment(user.userId, id, dto.text);
  }

  /** Exclui um comentário (somente o autor). */
  @Delete('comments/:id')
  @ApiParam({ name: 'id', description: 'ID do comentário.', example: 'clx789ghi' })
  @ApiNotFoundResponse({ description: 'Comentário não encontrado ou usuário não é o autor.' })
  removeComment(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.posts.removeComment(user.userId, id);
  }
}
