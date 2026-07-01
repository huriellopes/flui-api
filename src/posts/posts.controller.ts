import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser, CurrentUserData } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCommentDto, CreatePostDto } from './dto';
import { PostsService } from './posts.service';

@ApiTags('Feed')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  /** Cria um post no feed do grupo (foto opcional + descrição). */
  @Post('groups/:groupId/posts')
  create(
    @CurrentUser() user: CurrentUserData,
    @Param('groupId') groupId: string,
    @Body() dto: CreatePostDto,
  ) {
    return this.posts.create(user.userId, groupId, dto);
  }

  /** Lista os posts do grupo (mais recentes primeiro). */
  @Get('groups/:groupId/posts')
  list(@CurrentUser() user: CurrentUserData, @Param('groupId') groupId: string) {
    return this.posts.list(user.userId, groupId);
  }

  /** Exclui um post (somente o autor). */
  @Delete('posts/:id')
  remove(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.posts.remove(user.userId, id);
  }

  /** Curte/descurte um post (toggle). */
  @Post('posts/:id/like')
  like(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.posts.toggleLike(user.userId, id);
  }

  /** Lista os comentários de um post. */
  @Get('posts/:id/comments')
  comments(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.posts.listComments(user.userId, id);
  }

  /** Adiciona um comentário. */
  @Post('posts/:id/comments')
  addComment(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.posts.addComment(user.userId, id, dto.text);
  }

  /** Exclui um comentário (somente o autor). */
  @Delete('comments/:id')
  removeComment(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.posts.removeComment(user.userId, id);
  }
}
