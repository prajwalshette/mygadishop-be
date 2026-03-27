import '@/paths-init';

import { App } from '@/app';
import { AuthRoute } from '@modules/auth/auth.routes';
import { VehicleRoute } from '@modules/vehicle/vehicle.routes';
import { CustomerRoute } from '@modules/customer/customer.routes';
import { ServicingRoute } from '@modules/servicing/servicing.routes';
import { PaymentRoute } from '@modules/payment/payment.routes';
import { DashboardRoute } from '@modules/dashboard/dashboard.routes';
import { ShopRoute } from '@modules/shop/shop.routes';
import { SubscriptionRoute } from '@modules/subscription/subscription.routes';
import { UserRoute } from '@modules/user/user.routes';
import { AdminRoute } from '@modules/admin/admin.routes';


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
