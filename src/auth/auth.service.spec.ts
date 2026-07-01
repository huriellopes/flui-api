import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let users: jest.Mocked<Pick<UsersService, 'findByEmail' | 'create'>>;
  let jwt: jest.Mocked<Pick<JwtService, 'sign'>>;

  beforeEach(() => {
    users = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    jwt = {
      sign: jest.fn().mockReturnValue('signed.jwt.token'),
    };
    service = new AuthService(users as unknown as UsersService, jwt as unknown as JwtService);
  });

  describe('register', () => {
    it('cria usuário e retorna token quando o e-mail é novo', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.create.mockResolvedValue({
        id: 'user-1',
        email: 'novo@ex.com',
        name: 'Novo',
      } as never);

      const result = await service.register({
        name: 'Novo',
        email: 'novo@ex.com',
        password: 'senha12345',
      });

      expect(users.create).toHaveBeenCalledTimes(1);
      // a senha nunca deve ser armazenada em texto puro
      const createArg = users.create.mock.calls[0][0];
      expect(createArg.passwordHash).toBeDefined();
      expect(createArg.passwordHash).not.toBe('senha12345');
      expect(result).toEqual({
        accessToken: 'signed.jwt.token',
        user: { id: 'user-1', email: 'novo@ex.com', name: 'Novo' },
      });
    });

    it('lança ConflictException se o e-mail já existe', async () => {
      users.findByEmail.mockResolvedValue({ id: 'x' } as never);

      await expect(
        service.register({ name: 'Dup', email: 'dup@ex.com', password: 'senha12345' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(users.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('lança Unauthorized quando o usuário não existe', async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nao@existe.com', password: 'senha12345' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lança Unauthorized quando a senha está errada', async () => {
      const passwordHash = await bcrypt.hash('correta12345', 10);
      users.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'user@ex.com',
        name: 'User',
        passwordHash,
      } as never);

      await expect(
        service.login({ email: 'user@ex.com', password: 'errada00000' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('retorna token quando as credenciais estão corretas', async () => {
      const passwordHash = await bcrypt.hash('correta12345', 10);
      users.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'user@ex.com',
        name: 'User',
        passwordHash,
      } as never);

      const result = await service.login({ email: 'user@ex.com', password: 'correta12345' });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user).toEqual({ id: 'user-1', email: 'user@ex.com', name: 'User' });
    });
  });
});
