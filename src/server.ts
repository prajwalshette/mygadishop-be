// Register path aliases BEFORE any imports that use them
// This must be done using require to ensure execution order
const { join } = require('path');
const { register } = require('tsconfig-paths');

// Register path aliases explicitly for Vercel serverless environment
// Use process.cwd() which points to project root in Vercel
const projectRoot = process.cwd();
const baseUrl = join(projectRoot, 'src');

// Match tsconfig.json paths configuration (baseUrl: "src")
const paths = {
  '@/*': ['*'],
  '@config': ['config'],
  '@controllers/*': ['controllers/*'],
  '@dtos/*': ['dtos/*'],
  '@exceptions/*': ['exceptions/*'],
  '@interfaces/*': ['interfaces/*'],
  '@middlewares/*': ['middlewares/*'],
  '@routes/*': ['routes/*'],
  '@services/*': ['services/*'],
  '@utils/*': ['utils/*'],
};

register({
  baseUrl,
  paths,
});

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
