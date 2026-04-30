import type { Prisma, Vehicle, VehicleDocument, TwoWheelerDetail, FourWheelerDetail } from '@prisma/client';
import { Service } from 'typedi';
import { ConflictException, HttpException, NotFoundException } from '@/exceptions';
import prisma from '@/lib/prisma';
import { ulid } from 'ulid';
import type { IVehicle, IVehicleDocument, ITwoWheelerDetail, IFourWheelerDetail } from './vehicle.interface';
import { DocumentType, VehicleCategory } from '@prisma/client';
import { buildMetaDescription, buildMetaTitle, generateUniqueSlug } from '@/utils/seo';
import { generateVehiclePresignedUrls, getS3ObjectStream, presignS3Url } from '@/services/aws/aws.service';
import { deleteVehiclePresignedCache, getVehiclePresignedCache } from '@/services/redis/cache/vehicle.cache';
import { logger } from '@/utils/logger';
import type { ExportVehicleQueryDto, GetVehicleQueryDto } from './vehicle.validator';

@Service()
export class VehicleService {
  private prisma = prisma;

  /** Merges API/partial payload with an existing DB row for SEO. */
  private mergeVehicleSnapshotForSeo(partial: Partial<IVehicle> & Record<string, unknown>, existing: Vehicle | null | undefined) {
    const p = partial;
    const e = existing ?? undefined;
    const num = (a: unknown, b: unknown, fallback: number) => {
      const x = a ?? b;
      return typeof x === 'number' && !Number.isNaN(x) ? x : fallback;
    };

    const vehicle_category = p.vehicle_category ?? e?.vehicle_category ?? VehicleCategory.TWO_WHEELER;

    return {
      brand: (p.brand as string) ?? e?.brand ?? '',
      model: (p.model as string) ?? e?.model ?? '',
      variant: (p.variant as string | undefined) ?? e?.variant,
      registration_number: (p.registration_number as string) ?? e?.registration_number ?? '',
      manufacture_year: num(p.manufacture_year, e?.manufacture_year, new Date().getFullYear()),
      ownership_city: (p as { ownership_city?: string | null }).ownership_city ?? e?.ownership_city,
      vehicle_category,
      selling_price: (p.selling_price as number | undefined) ?? e?.selling_price ?? undefined,
      odometer_reading: num(p.odometer_reading, e?.odometer_reading, 0),
      ownership: String((p.ownership as string) ?? e?.ownership ?? 'FIRST'),
      fuel_type: String((p.fuel_type as string) ?? e?.fuel_type ?? 'PETROL'),
      condition: String((p as { condition?: string }).condition ?? e?.condition ?? 'GOOD'),
      accident_history: Boolean((p as { accident_history?: boolean }).accident_history ?? e?.accident_history ?? false),
      rc_available: Boolean((p as { rc_available?: boolean }).rc_available ?? e?.rc_available ?? true),
      insurance_valid_till:
        p.insurance_valid_till !== undefined
          ? p.insurance_valid_till
            ? new Date(p.insurance_valid_till as string | Date)
            : null
          : (e?.insurance_valid_till ?? null),
    };
  }

  /** SEO fields are server-only; not accepted from clients in validators. */
  private async resolveVehicleSeoFields(
    shop_id: string,
    snapshot: ReturnType<VehicleService['mergeVehicleSnapshotForSeo']>,
    options: { excludeVehicleId?: string },
  ): Promise<{ slug: string; meta_title: string; meta_description: string }> {
    const shop = await this.prisma.shop.findUnique({ where: { id: shop_id }, select: { shop_name: true } });
    const shopName = shop?.shop_name ?? 'MyGadiShop';

    const slugInput = {
      brand: snapshot.brand,
      model: snapshot.model,
      ownership_city: snapshot.ownership_city,
      manufacture_year: snapshot.manufacture_year,
      registration_number: snapshot.registration_number,
      vehicle_category: snapshot.vehicle_category,
    };

    return {
      slug: await generateUniqueSlug(slugInput, this.prisma, {
        excludeVehicleId: options.excludeVehicleId,
      }),
      meta_title: buildMetaTitle(
        {
          manufacture_year: snapshot.manufacture_year,
          brand: snapshot.brand,
          model: snapshot.model,
          variant: snapshot.variant,
          ownership_city: snapshot.ownership_city,
          selling_price: snapshot.selling_price,
        },
        shopName,
      ),
      meta_description: buildMetaDescription({
        manufacture_year: snapshot.manufacture_year,
        brand: snapshot.brand,
        model: snapshot.model,
        variant: snapshot.variant,
        ownership_city: snapshot.ownership_city,
        selling_price: snapshot.selling_price,
        odometer_reading: snapshot.odometer_reading,
        ownership: snapshot.ownership,
        fuel_type: snapshot.fuel_type,
        condition: snapshot.condition,
        accident_history: snapshot.accident_history,
        rc_available: snapshot.rc_available,
        insurance_valid_till: snapshot.insurance_valid_till ?? null,
      }),
    };
  }

  // -----------------------------
  // CREATE VEHICLE - Add new vehicle to inventory
  // -----------------------------
  public async createVehicle(
    vehicleData: IVehicle,
    shop_id: string,
    documentRows?: { doc_type: DocumentType; file_url: string; expiry_date?: Date | null; notes?: string | null }[],
  ): Promise<IVehicle> {
    try {
      const isExistVehicle = await this.prisma.vehicle.findFirst({
        where: {
          registration_number: vehicleData.registration_number,
          chassis_number: vehicleData.chassis_number,
          deleted_at: null,
          shop_id: shop_id,
        },
      });

      if (isExistVehicle) {
        logger.warn(
          `Create vehicle failed: Vehicle already exists - Registration: ${vehicleData.registration_number}, Chassis: ${vehicleData.chassis_number}`,
        );
        throw new ConflictException(
          `Vehicle already exists with registration_number: ${vehicleData.registration_number}, chassis_number: ${vehicleData.chassis_number}`,
        );
      }

      const {
        vehicle_documents: _vd,
        slug: _omitSlug,
        meta_title: _omitMetaTitle,
        meta_description: _omitMetaDesc,
        two_wheeler_detail,
        four_wheeler_detail,
        ...vehicleRest
      } = vehicleData as any;
      void _vd;
      void _omitSlug;
      void _omitMetaTitle;
      void _omitMetaDesc;

      const snapshot = this.mergeVehicleSnapshotForSeo(vehicleData as Partial<IVehicle> & Record<string, unknown>, null);
      const seo = await this.resolveVehicleSeoFields(shop_id, snapshot, {});

      const vehicle = await this.prisma.vehicle.create({
        data: {
          id: ulid(),
          shop_id: shop_id,
          ...vehicleRest,
          // If client omits it, persist as 0 by default.
          estimated_rto_charges: vehicleRest.estimated_rto_charges ?? 0,
          slug: seo.slug,
          meta_title: seo.meta_title,
          meta_description: seo.meta_description,
          selling_date: vehicleData.selling_date ? new Date(vehicleData.selling_date) : null,
          buying_date: vehicleData.buying_date ? new Date(vehicleData.buying_date) : null,
          insurance_valid_till: vehicleData.insurance_valid_till ? new Date(vehicleData.insurance_valid_till) : null,
          registration_valid_till: vehicleData.registration_valid_till ? new Date(vehicleData.registration_valid_till) : null,
          puc_valid_till: vehicleData.puc_valid_till ? new Date(vehicleData.puc_valid_till) : null,
          vehicleDocuments:
            documentRows && documentRows.length > 0
              ? {
                  create: documentRows.map(row => ({
                    id: ulid(),
                    doc_type: row.doc_type,
                    file_url: row.file_url,
                    expiry_date: row.expiry_date ?? undefined,
                    notes: row.notes ?? undefined,
                  })),
                }
              : undefined,
          two_wheeler_detail:
            vehicleData.vehicle_category === VehicleCategory.TWO_WHEELER && two_wheeler_detail
              ? {
                  create: {
                    id: ulid(),
                    ...two_wheeler_detail,
                  },
                }
              : undefined,
          four_wheeler_detail:
            vehicleData.vehicle_category === VehicleCategory.FOUR_WHEELER && four_wheeler_detail
              ? {
                  create: {
                    id: ulid(),
                    ...four_wheeler_detail,
                  },
                }
              : undefined,
        } as Prisma.VehicleUncheckedCreateInput,
        include: { vehicleDocuments: true, two_wheeler_detail: true, four_wheeler_detail: true },
      });

      logger.info(`Vehicle created successfully: ${vehicle.registration_number} (${vehicle.id})`);
      return this.mapVehicleToIVehicle(vehicle);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Create vehicle error: ${error.message}`);
      throw error;
    }
  }

  /** Raw DB row with documents (no presigned URLs) — for update merge logic. */
  public async getVehicleWithDocumentsRaw(vehicleId: string): Promise<(Vehicle & { vehicleDocuments: VehicleDocument[] }) | null> {
    return this.prisma.vehicle.findFirst({
      where: { id: vehicleId, deleted_at: null },
      include: { vehicleDocuments: true },
    });
  }

  private mapVehicleToIVehicle(
    vehicle: Vehicle & {
      vehicleDocuments?: VehicleDocument[];
      two_wheeler_detail?: TwoWheelerDetail | null;
      four_wheeler_detail?: FourWheelerDetail | null;
    },
  ): IVehicle {
    const { vehicleDocuments, two_wheeler_detail, four_wheeler_detail, ...v } = vehicle;
    return {
      ...v,
      vehicle_documents: (vehicleDocuments ?? []).map(d => this.mapVehicleDocumentToIVehicleDocument(d)),
      two_wheeler_detail: two_wheeler_detail ? (two_wheeler_detail as ITwoWheelerDetail) : null,
      four_wheeler_detail: four_wheeler_detail ? (four_wheeler_detail as IFourWheelerDetail) : null,
    } as unknown as IVehicle;
  }

  private mapVehicleDocumentToIVehicleDocument(d: VehicleDocument): IVehicleDocument {
    return {
      id: d.id,
      vehicle_id: d.vehicle_id,
      doc_type: d.doc_type,
      status: d.status,
      file_url: d.file_url,
      expiry_date: d.expiry_date,
      notes: d.notes,
      uploaded_at: d.uploaded_at,
      updated_at: d.updated_at,
    };
  }

  private async presignVehicleDocumentsForResponse(docs: VehicleDocument[]): Promise<IVehicleDocument[]> {
    return Promise.all(
      docs.map(async d => ({
        ...this.mapVehicleDocumentToIVehicleDocument(d),
        file_url: d.file_url ? ((await presignS3Url(d.file_url)) ?? d.file_url) : d.file_url,
      })),
    );
  }

  // -----------------------------
  // UPDATE VEHICLE - Modify existing vehicle details
  // -----------------------------
  public async updateVehicle(
    vehicleId: string,
    vehicleData: Partial<IVehicle>,
    documentRows?: { doc_type: DocumentType; file_url: string; expiry_date?: Date | null; notes?: string | null }[],
  ): Promise<IVehicle> {
    try {
      const existingVehicle = await this.prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          deleted_at: null,
        },
      });

      if (!existingVehicle) {
        logger.warn(`Update vehicle failed: Vehicle not found - ${vehicleId}`);
        throw new NotFoundException(`Vehicle not found with id: ${vehicleId}`);
      }

      const {
        vehicle_documents: _vd,
        slug: _omitSlug,
        meta_title: _omitMetaTitle,
        meta_description: _omitMetaDesc,
        two_wheeler_detail,
        four_wheeler_detail,
        ...vehicleRest
      } = vehicleData as any;
      void _vd;
      void _omitSlug;
      void _omitMetaTitle;
      void _omitMetaDesc;

      if (vehicleRest.registration_number || vehicleRest.chassis_number) {
        const duplicateVehicle = await this.prisma.vehicle.findFirst({
          where: {
            OR: [
              ...(vehicleRest.registration_number ? [{ registration_number: vehicleRest.registration_number }] : []),
              ...(vehicleRest.chassis_number ? [{ chassis_number: vehicleRest.chassis_number }] : []),
            ],
            AND: [{ id: { not: vehicleId } }, { deleted_at: null }],
          },
        });

        if (duplicateVehicle) {
          logger.warn(`Update vehicle failed: Duplicate registration/chassis number`);
          throw new ConflictException(`Vehicle already exists with the same registration_number or chassis_number`);
        }
      }

      const snapshot = this.mergeVehicleSnapshotForSeo(vehicleData as Partial<IVehicle> & Record<string, unknown>, existingVehicle);
      const seo = await this.resolveVehicleSeoFields(existingVehicle.shop_id, snapshot, { excludeVehicleId: vehicleId });

      const updatedVehicle = await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          ...vehicleRest,
          slug: seo.slug,
          meta_title: seo.meta_title,
          meta_description: seo.meta_description,
          updated_at: new Date(),
          selling_date: vehicleRest.selling_date ? new Date(vehicleRest.selling_date) : existingVehicle.selling_date,
          buying_date: vehicleRest.buying_date ? new Date(vehicleRest.buying_date) : existingVehicle.buying_date,
          insurance_valid_till: vehicleRest.insurance_valid_till ? new Date(vehicleRest.insurance_valid_till) : existingVehicle.insurance_valid_till,
          registration_valid_till: vehicleRest.registration_valid_till
            ? new Date(vehicleRest.registration_valid_till)
            : existingVehicle.registration_valid_till,
          puc_valid_till: vehicleRest.puc_valid_till ? new Date(vehicleRest.puc_valid_till) : existingVehicle.puc_valid_till,

          two_wheeler_detail:
            two_wheeler_detail && existingVehicle.vehicle_category === VehicleCategory.TWO_WHEELER
              ? {
                  upsert: {
                    create: { id: ulid(), ...two_wheeler_detail },
                    update: two_wheeler_detail,
                  },
                }
              : undefined,
          four_wheeler_detail:
            four_wheeler_detail && existingVehicle.vehicle_category === VehicleCategory.FOUR_WHEELER
              ? {
                  upsert: {
                    create: { id: ulid(), ...four_wheeler_detail },
                    update: four_wheeler_detail,
                  },
                }
              : undefined,
        } as Prisma.VehicleUncheckedUpdateInput,
      });

      if (documentRows !== undefined) {
        for (const row of documentRows) {
          await this.prisma.vehicleDocument.upsert({
            where: {
              vehicle_id_doc_type: { vehicle_id: vehicleId, doc_type: row.doc_type },
            },
            create: {
              id: ulid(),
              vehicle_id: vehicleId,
              doc_type: row.doc_type,
              file_url: row.file_url,
              expiry_date: row.expiry_date ?? undefined,
              notes: row.notes ?? undefined,
            },
            update: {
              file_url: row.file_url,
              expiry_date: row.expiry_date ?? undefined,
              notes: row.notes ?? undefined,
            },
          });
        }
      }

      const withDocs = await this.prisma.vehicle.findFirstOrThrow({
        where: { id: vehicleId },
        include: { vehicleDocuments: true, two_wheeler_detail: true, four_wheeler_detail: true },
      });

      logger.info(`Vehicle updated successfully: ${updatedVehicle.registration_number} (${vehicleId})`);

      await deleteVehiclePresignedCache(vehicleId);

      return this.mapVehicleToIVehicle(withDocs);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Update vehicle error for ${vehicleId}: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // GET VEHICLE BY ID - Retrieve single vehicle
  // -----------------------------
  public async getVehicleById(vehicleId: string): Promise<IVehicle | null> {
    try {
      const vehicle = await this.prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          deleted_at: null,
        },
        include: {
          seller_customer: true,
          buyer_customer: true,
          payments: true,
          vehicleDocuments: true,
          two_wheeler_detail: true,
          four_wheeler_detail: true,
        },
      });

      if (!vehicle) {
        return null;
      }

      try {
        let presignedUrls = await getVehiclePresignedCache(vehicleId);
        if (!presignedUrls) {
          logger.info(`Cache miss for vehicle ${vehicleId}, generating new presigned URLs`);
          presignedUrls = await generateVehiclePresignedUrls(vehicleId, vehicle.vehicle_image_urls || [], 3600);
        }

        const vehicleDocumentsPresigned = await this.presignVehicleDocumentsForResponse(vehicle.vehicleDocuments ?? []);

        logger.info(`Vehicle retrieved successfully: ${vehicleId}`);
        const mapped = this.mapVehicleToIVehicle(vehicle);
        return {
          ...mapped,
          vehicle_image_urls: presignedUrls?.imageUrls || vehicle.vehicle_image_urls || [],
          vehicle_documents: vehicleDocumentsPresigned,
        };
      } catch (urlError) {
        logger.error(urlError, `Error processing URLs for vehicle ${vehicleId}`);
        const mapped = this.mapVehicleToIVehicle(vehicle);
        return {
          ...mapped,
          vehicle_image_urls: vehicle.vehicle_image_urls || [],
          vehicle_documents: (vehicle.vehicleDocuments ?? []).map(d => this.mapVehicleDocumentToIVehicleDocument(d)),
        };
      }
    } catch (error) {
      logger.error(`Get vehicle error for ${vehicleId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get first vehicle image as stream for share (proxied from S3 to avoid CORS).
   * Returns null if vehicle not found, not owned by shop, or no images.
   */
  public async getVehicleShareImageStream(
    vehicleId: string,
    shop_id: string,
  ): Promise<{ stream: import('stream').Readable; contentType: string } | null> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, shop_id, deleted_at: null },
      select: { vehicle_image_urls: true },
    });
    if (!vehicle?.vehicle_image_urls?.length) {
      return null;
    }
    const firstImageUrl = vehicle.vehicle_image_urls[0];
    const result = await getS3ObjectStream(firstImageUrl);
    if (!result?.Body) {
      return null;
    }
    return {
      stream: result.Body,
      contentType: result.ContentType ?? 'image/jpeg',
    };
  }

  /**
   * Stream a vehicle document by docType (proxy from S3 to avoid CORS).
   */
  public async getVehicleDocumentStream(
    vehicleId: string,
    shop_id: string,
    docType: DocumentType,
  ): Promise<{ stream: import('stream').Readable; contentType: string } | null> {
    const doc = await this.prisma.vehicleDocument.findFirst({
      where: {
        vehicle_id: vehicleId,
        doc_type: docType,
        vehicle: { shop_id, deleted_at: null },
      },
      select: { file_url: true },
    });

    if (!doc?.file_url) return null;

    const result = await getS3ObjectStream(doc.file_url);
    if (!result?.Body) return null;

    return {
      stream: result.Body,
      contentType: result.ContentType ?? 'application/octet-stream',
    };
  }

  // -----------------------------
  // GET ALL VEHICLES - Retrieve paginated vehicle list
  // -----------------------------
  public async getAllVehicle(query: GetVehicleQueryDto, shop_id: string): Promise<any> {
    const { page, limit, search, status, vehicle_category, type, sortBy, sortOrder } = query;

    try {
      const skip = (page - 1) * limit;

      // Build where clause with filters
      const whereClause: any = {
        shop_id: shop_id,
        deleted_at: null,
      };

      // Add search filter (searches across multiple fields)
      if (search) {
        whereClause.OR = [
          { brand: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
          { variant: { contains: search, mode: 'insensitive' } },
          { registration_number: { contains: search, mode: 'insensitive' } },
          { chassis_number: { contains: search, mode: 'insensitive' } },
          { engine_number: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Add status filter
      if (status) {
        whereClause.status = status;
      }

      // Add type filter
      if (vehicle_category) {
        whereClause.vehicle_category = vehicle_category;
      } else if (type) {
        whereClause.vehicle_type = type;
      }

      // Fetch vehicles and total count in parallel using Promise.all
      const [vehicles, total] = await Promise.all([
        this.prisma.vehicle.findMany({
          where: whereClause,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
          include: { vehicleDocuments: true, two_wheeler_detail: true, four_wheeler_detail: true },
        }),
        this.prisma.vehicle.count({ where: whereClause }),
      ]);

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      // Process vehicles to add presigned URLs
      const vehiclesWithPresignedUrls = await Promise.all(
        vehicles.map(async vehicle => {
          try {
            let presignedUrls = await getVehiclePresignedCache(vehicle.id);

            if (!presignedUrls) {
              logger.info(`Cache miss for vehicle ${vehicle.id}, generating new presigned URLs`);
              presignedUrls = await generateVehiclePresignedUrls(vehicle.id, vehicle.vehicle_image_urls || [], 3600);
            }

            const vehicleDocumentsPresigned = await this.presignVehicleDocumentsForResponse(vehicle.vehicleDocuments ?? []);
            const mapped = this.mapVehicleToIVehicle(vehicle);

            return {
              ...mapped,
              vehicle_image_urls: presignedUrls?.imageUrls || [],
              vehicle_documents: vehicleDocumentsPresigned,
            };
          } catch (urlError) {
            logger.error(urlError, `Error processing URLs for vehicle ${vehicle.id}`);
            const mapped = this.mapVehicleToIVehicle(vehicle);
            return {
              ...mapped,
              vehicle_image_urls: vehicle.vehicle_image_urls || [],
              vehicle_documents: (vehicle.vehicleDocuments ?? []).map(d => this.mapVehicleDocumentToIVehicleDocument(d)),
            };
          }
        }),
      );

      logger.info(
        `Retrieved ${total} vehicles (page ${page}, limit ${limit}, filters: ${JSON.stringify({ search, status, vehicle_category, type })})`,
      );

      return {
        vehicles: vehiclesWithPresignedUrls,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error(`Get all vehicles error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // GET VEHICLE STATISTICS - Get vehicle stats for dashboard
  // -----------------------------
  public async getVehicleStats(shop_id: string): Promise<any> {
    try {
      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      // Total vehicles
      const totalVehicles = await this.prisma.vehicle.count({
        where: {
          shop_id,
          deleted_at: null,
        },
      });

      // Available vehicles
      const availableVehicles = await this.prisma.vehicle.count({
        where: {
          shop_id,
          deleted_at: null,
          status: 'AVAILABLE',
        },
      });

      // Sold vehicles this month
      const soldThisMonth = await this.prisma.vehicle.count({
        where: {
          shop_id,
          deleted_at: null,
          status: 'SOLD',
          created_at: { gte: startOfCurrentMonth },
        },
      });

      // Maintenance vehicles
      const maintenanceVehicles = await this.prisma.vehicle.count({
        where: {
          shop_id,
          deleted_at: null,
          status: 'MAINTENANCE',
        },
      });

      // New vehicles this month
      const newThisMonth = await this.prisma.vehicle.count({
        where: {
          shop_id,
          deleted_at: null,
          created_at: { gte: startOfCurrentMonth },
        },
      });

      // Vehicles from last month
      const lastMonthVehicles = await this.prisma.vehicle.count({
        where: {
          shop_id,
          deleted_at: null,
          created_at: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      });

      // Calculate growth rate
      const growthRate =
        lastMonthVehicles > 0 ? Math.round(((newThisMonth - lastMonthVehicles) / lastMonthVehicles) * 100) : newThisMonth > 0 ? 100 : 0;

      logger.info(
        `Retrieved vehicle stats for shop ${shop_id}: total=${totalVehicles}, available=${availableVehicles}, soldThisMonth=${soldThisMonth}, maintenance=${maintenanceVehicles}, newThisMonth=${newThisMonth}, growthRate=${growthRate}%`,
      );

      return {
        totalVehicles,
        availableVehicles,
        soldThisMonth,
        maintenanceVehicles,
        newThisMonth,
        growthRate,
        lastMonthVehicles,
      };
    } catch (error) {
      logger.error(`Get vehicle stats error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // EXPORT VEHICLES - Get all vehicles for CSV export (no pagination)
  // -----------------------------
  public async exportVehicles(query: ExportVehicleQueryDto, shop_id: string): Promise<IVehicle[]> {
    const { search, status, vehicle_category, type, sortBy, sortOrder } = query;

    try {
      // Build where clause with filters
      const whereClause: any = {
        shop_id: shop_id,
        deleted_at: null,
      };

      // Add search filter (searches across multiple fields)
      if (search) {
        whereClause.OR = [
          { brand: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
          { variant: { contains: search, mode: 'insensitive' } },
          { registration_number: { contains: search, mode: 'insensitive' } },
          { chassis_number: { contains: search, mode: 'insensitive' } },
          { engine_number: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Add status filter
      if (status) {
        whereClause.status = status;
      }

      // Add type filter
      if (vehicle_category) {
        whereClause.vehicle_category = vehicle_category;
      } else if (type) {
        whereClause.vehicle_type = type;
      }

      // Fetch all vehicles without pagination
      const vehicles = await this.prisma.vehicle.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
        include: { two_wheeler_detail: true, four_wheeler_detail: true },
      });

      logger.info(`Exporting ${vehicles.length} vehicles (filters: ${JSON.stringify({ search, status, vehicle_category, type })})`);

      return vehicles.map(vehicle => this.mapVehicleToIVehicle(vehicle));
    } catch (error) {
      logger.error(`Export vehicles error: ${error.message}`);
      throw error;
    }
  }

  // -----------------------------
  // DELETE VEHICLE - Soft delete vehicle from inventory
  // -----------------------------
  public async deleteVehicle(vehicleId: string): Promise<boolean> {
    try {
      const existingVehicle = await this.prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          deleted_at: null,
        },
      });

      if (!existingVehicle) {
        logger.warn(`Delete vehicle failed: Vehicle not found - ${vehicleId}`);
        throw new NotFoundException(`Vehicle not found with id: ${vehicleId}`);
      }

      await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          deleted_at: new Date(),
          updated_at: new Date(),
        },
      });

      logger.info(`Vehicle deleted successfully: ${vehicleId}`);

      // Invalidate presigned URL cache
      await deleteVehiclePresignedCache(vehicleId);

      return true;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      logger.error(`Delete vehicle error for ${vehicleId}: ${error.message}`);
      throw error;
    }
  }
}
