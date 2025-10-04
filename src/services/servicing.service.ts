import { Prisma } from '@prisma/client';
import { ServicingStatus } from '@/interfaces/servicing.interface';
import { Service } from 'typedi';
import { HttpException } from '@/exceptions/HttpException';
import prisma from '@/database';
import { IServicing } from '@/interfaces/servicing.interface';
import { formatPrismaError } from '@/exceptions/prismaException';
import { ulid } from 'ulid';

@Service()
export class ServicingService {
  private prisma = prisma;

  // Create
  public async createServicing(data: IServicing): Promise<IServicing> {
    try {
      const newServicing = await this.prisma.servicing.create({
        data: {
          id: ulid(),
          vehicle_id: data.vehicle_id,
          customer_id: data.customer_id,
          service_date: data.service_date,
          service_type: data.service_type,
          description: data.description,
          cost: data.cost,
          status: data.status || ServicingStatus.PENDING,
          next_service_date: data.next_service_date,
        },
      });
      return { ...newServicing, status: newServicing.status as ServicingStatus };
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error creating servicing: ${error.message}`);
    }
  }

  // Get all with pagination
  public async getServicings(pageNumber: number, pageSize: number): Promise<{ servicings: IServicing[]; servicingCount: number }> {
    try {
      const skip = (pageNumber - 1) * pageSize;

      const servicings = await this.prisma.servicing.findMany({
        orderBy: { service_date: 'desc' },
        skip,
        take: pageSize,
      });

      const servicingCount = await this.prisma.servicing.count();

      return {
        servicings: servicings.map(s => ({
          ...s,
          status: s.status as ServicingStatus,
        })),
        servicingCount,
      };
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error fetching servicings: ${error.message}`);
    }
  }

  // Get by ID
  public async getServicingById(id: string): Promise<IServicing> {
    try {
      const servicing = await this.prisma.servicing.findUnique({ where: { id } });
      if (!servicing) throw new HttpException(404, 'Servicing not found');
      return { ...servicing, status: servicing.status as ServicingStatus };
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error fetching servicing: ${error.message}`);
    }
  }

  // Update
  public async updateServicing(id: string, data: Partial<IServicing>): Promise<IServicing> {
    try {
      const servicing = await this.prisma.servicing.update({
        where: { id },
        data: {
          ...data,
        },
      });
      return { ...servicing, status: servicing.status as ServicingStatus };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new HttpException(404, 'Servicing not found');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error updating servicing: ${error.message}`);
    }
  }

  // Delete
  public async deleteServicing(id: string): Promise<any> {
    try {
      const servicing = await this.prisma.servicing.update({ where: { id }, data: { is_deleted: true } });
      return true;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new HttpException(404, 'Servicing not found');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw formatPrismaError(error);
      }
      throw new HttpException(500, `Error deleting servicing: ${error.message}`);
    }
  }
}
