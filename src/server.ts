// Import path registration FIRST - this must happen before any other imports
// Using require() ensures it runs before ES6 imports are hoisted
require('./paths');

import { App } from '@/app';
import { AuthRoute } from '@routes/auth.route';
import { ValidateEnv } from '@utils/validateEnv';
import { VehicleRoute } from './routes/vehicle.route';
import { CustomerRoute } from './routes/customer.route';
import { ServicingRoute } from './routes/servicing.route';
import { PaymentRoute } from './routes/payment.route';
import { DashboardRoute } from './routes/dashboard.route';
import { ShopRoute } from './routes/shop.route';
import { SubscriptionRoute } from './routes/subscription.route';
import { UserRoute } from './routes/user.route';

import { AdminRoute } from './routes/admin.routes';

ValidateEnv();

const app = new App([
  new AuthRoute(),
  new AdminRoute(),
  new VehicleRoute(),
  new CustomerRoute(),
  new ServicingRoute(),
  new PaymentRoute(),
  new DashboardRoute(),
  new ShopRoute(),
  new SubscriptionRoute(),
  new UserRoute(),
]);

export default app.app;

if (process.env.NODE_ENV !== 'production') {
  app.listen();
}
