import { Prisma, PrismaClient } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { Service } from 'typedi';
import { SECRET_KEY } from '@config';
import { CreateUserDto, LoginAdminUserDto } from '@dtos/users.dto';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, TokenData } from '@interfaces/auth.interface';
import { AdminRole, AdminUser, User } from '@interfaces/users.interface';
import prisma from '@/database';
import { ulid } from 'ulid';
import { formatPrismaError } from '@/exceptions/prismaException';

@Service()
export class AuthService {
  private prisma = prisma;

  public async adminLogIn(adminUserData: LoginAdminUserDto): Promise<{ cookie: string; findAdminUser: AdminUser, token: string}> {
    try {
      const findAdminUser = await this.prisma.admin.findUnique({ where: { email: adminUserData.email } });
      if (!findAdminUser) throw new HttpException(409, `This email ${adminUserData.email} was not found`);

      const isPasswordMatching: boolean = await compare(adminUserData.password, findAdminUser.password);
      if (!isPasswordMatching) throw new HttpException(409, 'Password is not matching');

       // Generate session token
      const session_id = ulid();
      const tokenData = this.createToken({ ...findAdminUser, role: findAdminUser.role as AdminRole }, session_id);
      const cookie = this.createCookie(tokenData);

      // Create session entry
      await this.prisma.session.create({
        data: {
          id: session_id,
          admin_id: findAdminUser.id,
          token: tokenData.token,
          device_info: adminUserData.device_info as any,
          expires_at: new Date(Date.now() + tokenData.expiresIn * 1000),
        },
      });

      delete findAdminUser.password;

      return { cookie, findAdminUser: { ...findAdminUser, role: findAdminUser.role as AdminRole }, token: tokenData.token };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error Admin Login: ${error.message}`);
    }
  }

  public async addAdminUser(adminUserData: AdminUser): Promise<AdminUser> {
    try {
      const findAdminUser = await this.prisma.admin.findUnique({ where: { email: adminUserData.email } });
      if (findAdminUser) throw new HttpException(409, `This email ${adminUserData.email} admin already exist`);

      const hashedPassword = await hash(adminUserData.password, 10);

      const admin = await this.prisma.admin.create({
        data: {
          id: ulid(),
          email: adminUserData.email,
          password: hashedPassword,
          name: adminUserData.name,
          role: adminUserData.role,
        },
        select: {
          id: true,
          email: true,
          password: true,
          name: true,
          role: true,
        },
      });

      return { ...admin, role: admin.role as AdminRole };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error Add New Admin: ${error.message}`);
    }
  }

  public async logout(token: string, session_id: string): Promise<void> {
    try {
      if (!token) throw new HttpException(401, 'No token provided');

      if (!session_id) throw new HttpException(401, 'Invalid token payload');


      const existingSession = await prisma.session.findUnique({
        where: { id: session_id },
      });

      await prisma.session.delete({
        where: { id: session_id },
      });
    } catch (error) {
      const statusCode = error instanceof HttpException ? error.status : 500;
      const message = error instanceof HttpException ? error.message : 'Unexpected logout error';

      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 23);

      console.error(`${timestamp} error: [POST] /api/v1/auth/logout >> StatusCode:: ${statusCode}, Message:: ${message}`);

      throw new HttpException(statusCode, message);
    }
  }

  public createToken(adminUser: AdminUser, session_id: string): TokenData {
    const dataStoredInToken: DataStoredInToken = { id: adminUser.id, session_id: session_id };
    const secretKey: string = SECRET_KEY;
    const expiresIn: number = 60 * 60 * 24; // 1 day

    return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
  }

  public createCookie(tokenData: TokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`;
  }
}
