import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto';

const UPLOADS_DIR = join(process.cwd(), 'uploads');
const PUBLIC_URL = process.env.PUBLIC_URL ?? 'http://localhost:3000';

function extFromMime(mime?: string): string {
  if (mime?.includes('png')) return 'png';
  if (mime?.includes('webp')) return 'webp';
  return 'jpg';
}

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {
    if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  private async assertMember(userId: string, groupId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) throw new ForbiddenException('Você não faz parte deste grupo');
  }

  private saveImage(base64: string, mime?: string): string {
    const clean = base64.replace(/^data:[^;]+;base64,/, '');
    const filename = `${randomUUID()}.${extFromMime(mime)}`;
    writeFileSync(join(UPLOADS_DIR, filename), Buffer.from(clean, 'base64'));
    return `${PUBLIC_URL}/uploads/${filename}`;
  }

  async create(userId: string, groupId: string, dto: CreatePostDto) {
    await this.assertMember(userId, groupId);
    const imageUrl = dto.imageBase64 ? this.saveImage(dto.imageBase64, dto.imageMime) : null;
    return this.prisma.post.create({
      data: { groupId, authorId: userId, caption: dto.caption, imageUrl },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  async list(userId: string, groupId: string) {
    await this.assertMember(userId, groupId);
    return this.prisma.post.findMany({
      where: { groupId },
      include: { author: { select: { id: true, name: true } } },
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
