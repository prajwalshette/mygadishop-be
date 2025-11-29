import { cleanEnv, port, str } from 'envalid';

export const ValidateEnv = () => {
  cleanEnv(process.env, {
    NODE_ENV: str(),
    PORT: port(),
    // Razorpay keys are optional but recommended for payment features
    RAZORPAY_KEY_ID: str({ default: '', desc: 'Razorpay Key ID for payment processing' }),
    RAZORPAY_KEY_SECRET: str({ default: '', desc: 'Razorpay Key Secret for payment processing' }),
    RAZORPAY_WEBHOOK_SECRET: str({ default: '', desc: 'Razorpay Webhook Secret for payment verification' }),
  });
};
