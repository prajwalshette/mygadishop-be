import { App } from '@/app';
import { AuthRoute } from '@routes/auth.route';
import { ValidateEnv } from '@utils/validateEnv';
import { VehicleRoute } from './routes/vehicle.route';
import { CustomerRoute } from './routes/customer.route';
import { ServicingRoute } from './routes/servicing.route';
import { PaymentRoute } from './routes/payment.route';
import { DashboardRoute } from './routes/dashboard.route';

ValidateEnv();

const app = new App([
    new AuthRoute(),
    new VehicleRoute(),
    new CustomerRoute(),
    new ServicingRoute(),
    new PaymentRoute(),
    new DashboardRoute(),
]);

app.listen();
