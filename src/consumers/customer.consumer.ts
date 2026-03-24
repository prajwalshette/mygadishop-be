import { isAxiosError } from 'axios';
import { logger } from '@/utils/logger';
import { Job } from 'bullmq';
import { CustomerService } from '@/services/customer.service';
import { CreateCustomerDto } from '@/validator/customer.validator';

export class CustomerConsumer {
  public async processPayload(payload: Job) {
    const parsedPayload = payload.data;
    const customerService = new CustomerService();

    try {
      const data: CreateCustomerDto[] = parsedPayload.data;
      const shop_id = parsedPayload.shop_id;
      const upload_id = parsedPayload.upload_id;
      const lastBatch = parsedPayload.lastBatch;

      logger.info(`CustomerConsumer: Processing chunk for shop_id=${shop_id}, upload_id=${upload_id}, lastBatch=${lastBatch}`);

      await customerService.insertCustomersSync(data, shop_id, upload_id, lastBatch);

      logger.info(`CustomerConsumer: Successfully processed chunk for shop_id=${shop_id}, upload_id=${upload_id}`);
    } catch (error) {
      if (isAxiosError(error)) {
        logger.error(`---- Error ---- \n ${JSON.stringify({ error: error.response?.data, status: error.response?.status })} \n---- Error ---- `);
      } else {
        logger.error(error, `error in Customer consumer`);
      }
      // Note: error handling is also inside insertCustomersSync for Redis status
    }
  }
}
