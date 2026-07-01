import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { saveBase64Image } from '../common/image-storage';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto';

const AUTHOR_SELECT = { id: true, name: true, avatarUrl: true } as const;

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertMember(userId: string, groupId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) throw new ForbiddenException('Você não faz parte deste grupo');
  }

  private async postOrThrow(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post não encontrado');
    return post;
  }

  async create(userId: string, groupId: string, dto: CreatePostDto) {
    await this.assertMember(userId, groupId);
    const imageUrl = dto.imageBase64 ? saveBase64Image(dto.imageBase64, dto.imageMime) : null;
    const post = await this.prisma.post.create({
      data: { groupId, authorId: userId, caption: dto.caption, imageUrl },
      include: { author: { select: AUTHOR_SELECT } },
    });
    return { ...post, likeCount: 0, commentCount: 0, likedByMe: false };
  }

  async list(userId: string, groupId: string) {
    await this.assertMember(userId, groupId);
    const posts = await this.prisma.post.findMany({
      where: { groupId },
      include: {
        author: { select: AUTHOR_SELECT },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId }, select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return posts.map(({ _count, likes, ...p }) => ({
      ...p,
      likeCount: _count.likes,
      commentCount: _count.comments,
      likedByMe: likes.length > 0,
    }));
  }

  async remove(userId: string, postId: string) {
    const post = await this.postOrThrow(postId);
    if (post.authorId !== userId) {
      throw new ForbiddenException('Você só pode excluir seus próprios posts');
    }
    await this.prisma.post.delete({ where: { id: postId } });
    return { ok: true };
  }

  /** Curte/descurte um post (toggle). */
  async toggleLike(userId: string, postId: string) {
    const post = await this.postOrThrow(postId);
    await this.assertMember(userId, post.groupId);
    const existing = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (existing) await this.prisma.postLike.delete({ where: { id: existing.id } });
    else await this.prisma.postLike.create({ data: { postId, userId } });
    const likeCount = await this.prisma.postLike.count({ where: { postId } });
    return { liked: !existing, likeCount };
  }

  async listComments(userId: string, postId: string) {
    const post = await this.postOrThrow(postId);
    await this.assertMember(userId, post.groupId);
    return this.prisma.comment.findMany({
      where: { postId },
      include: { author: { select: AUTHOR_SELECT } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addComment(userId: string, postId: string, text: string) {
    const post = await this.postOrThrow(postId);
    await this.assertMember(userId, post.groupId);
    return this.prisma.comment.create({
      data: { postId, authorId: userId, text },
      include: { author: { select: AUTHOR_SELECT } },
    });
  }

  async removeComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comentário não encontrado');
    if (comment.authorId !== userId) {
      throw new ForbiddenException('Você só pode excluir seus próprios comentários');
    }
    await this.prisma.comment.delete({ where: { id: commentId } });
    return { ok: true };
  }
}
