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

  async create(userId: string, groupId: string, dto: CreatePostDto) {
    await this.assertMember(userId, groupId);
    const imageUrl = dto.imageBase64 ? saveBase64Image(dto.imageBase64, dto.imageMime) : null;
    return this.prisma.post.create({
      data: { groupId, authorId: userId, caption: dto.caption, imageUrl },
      include: { author: { select: AUTHOR_SELECT } },
    });
  }

  async list(userId: string, groupId: string) {
    await this.assertMember(userId, groupId);
    return this.prisma.post.findMany({
      where: { groupId },
      include: { author: { select: AUTHOR_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post não encontrado');
    if (post.authorId !== userId) {
      throw new ForbiddenException('Você só pode excluir seus próprios posts');
    }
    await this.prisma.post.delete({ where: { id: postId } });
    return { ok: true };
  }
}
