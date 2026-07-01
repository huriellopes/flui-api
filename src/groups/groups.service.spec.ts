import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { GroupsService } from './groups.service';

describe('GroupsService.remove (autorização)', () => {
  let prisma: { group: { findUnique: jest.Mock; delete: jest.Mock } };
  let service: GroupsService;

  beforeEach(() => {
    prisma = { group: { findUnique: jest.fn(), delete: jest.fn() } };
    service = new GroupsService(prisma as unknown as PrismaService);
  });

  it('lança NotFound quando o grupo não existe', async () => {
    prisma.group.findUnique.mockResolvedValue(null);
    await expect(service.remove('u1', 'g1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.group.delete).not.toHaveBeenCalled();
  });

  it('lança Forbidden quando não é o dono', async () => {
    prisma.group.findUnique.mockResolvedValue({ id: 'g1', ownerId: 'outro-user' });
    await expect(service.remove('u1', 'g1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.group.delete).not.toHaveBeenCalled();
  });

  it('exclui quando é o dono', async () => {
    prisma.group.findUnique.mockResolvedValue({ id: 'g1', ownerId: 'u1' });
    prisma.group.delete.mockResolvedValue({});
    await expect(service.remove('u1', 'g1')).resolves.toEqual({ ok: true });
    expect(prisma.group.delete).toHaveBeenCalledWith({ where: { id: 'g1' } });
  });
});
