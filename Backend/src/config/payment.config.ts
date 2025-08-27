// src/config/payment.config.ts
export interface PaymentConfig {
  isProduction: boolean;
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  minAmount: number; // in rupees
  currency: string;
  supportedMethods: string[];
}

export class PaymentConfigService {
  private static instance: PaymentConfigService;
  private config: PaymentConfig;

  private constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!keyId || !keySecret) {
      throw new Error('Missing Razorpay credentials. Please check environment variables.');
    }

    this.config = {
      isProduction: keyId.startsWith('rzp_live_'),
      keyId,
      keySecret,
      webhookSecret: webhookSecret || '',
      minAmount: 1, // ₹1 minimum
      currency: 'INR',
      supportedMethods: ['card', 'netbanking', 'upi', 'wallet']
    };

    // Log initialization
    console.log(`Payment Service initialized in ${this.config.isProduction ? 'PRODUCTION' : 'TEST'} mode`);
    
    if (this.config.isProduction) {
      console.log('🚨 PRODUCTION PAYMENT MODE ACTIVE - Real money will be processed!');
      
      // Validate production requirements
      if (!this.config.webhookSecret) {
        console.warn('⚠️  Webhook secret not configured - webhooks will not be validated!');
      }
    } else {
      console.log('🧪 Test mode active - No real money will be processed');
    }
  }

  public static getInstance(): PaymentConfigService {
    if (!PaymentConfigService.instance) {
      PaymentConfigService.instance = new PaymentConfigService();
    }
    return PaymentConfigService.instance;
  }

  public getConfig(): PaymentConfig {
    return { ...this.config };
  }

  public isProduction(): boolean {
    return this.config.isProduction;
  }

  public getMinAmountInPaise(): number {
    return this.config.minAmount * 100;
  }

  public validateAmount(amountInRupees: number): { valid: boolean; error?: string } {
    if (amountInRupees < this.config.minAmount) {
      return {
        valid: false,
        error: `Minimum amount is ₹${this.config.minAmount}`
      };
    }

    if (amountInRupees > 100000) { // ₹1 lakh max for safety
      return {
        valid: false,
        error: 'Maximum amount is ₹1,00,000'
      };
    }

    return { valid: true };
  }

  public formatAmount(amountInRupees: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: this.config.currency
    }).format(amountInRupees);
  }

  public logPaymentActivity(activity: string, data: any): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      environment: this.config.isProduction ? 'PRODUCTION' : 'TEST',
      activity,
      ...data
    };

    if (this.config.isProduction) {
      console.log(`🚨 PRODUCTION PAYMENT: ${activity}`, logData);
    } else {
      console.log(`🧪 TEST PAYMENT: ${activity}`, logData);
    }
  }
}

export const paymentConfig = PaymentConfigService.getInstance();
