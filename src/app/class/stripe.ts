// src/class/stripe.ts
import { Stripe as StripeType } from 'stripe';
import config from '../config';

interface IProduct {
  price_data: {
    currency: string;
    product_data: { name: string };
    unit_amount: number;
  };
  quantity: number;
}

class StripeService {
  private stripe() {
    return new StripeType(config.stripe_api_secret as string, {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    });
  }

  private handleError(error: unknown, message: string): never {
    if (error instanceof StripeType.errors.StripeError) {
      console.error('Stripe Error:', error.message);
      throw new Error(`Stripe Error: ${message} - ${error.message}`);
    } else if (error instanceof Error) {
      console.error('Error:', error.message);
      throw new Error(`${message} - ${error.message}`);
    } else {
      console.error('Unknown Error:', error);
      throw new Error(`${message} - An unknown error occurred.`);
    }
  }

  // ✅ Create Express Connected Account
  public async createConnectAccount(email: string) {
    try {
      return await this.stripe().accounts.create({
        type: 'express',
        email,
        capabilities: {
          transfers: { requested: true },
        },
      });
    } catch (error) {
      this.handleError(error, 'Error creating connect account');
    }
  }

  // ✅ Generate Onboarding Link
  public async generateAccountLink(accountId: string) {
    try {
      return await this.stripe().accountLinks.create({
        account: accountId,
        refresh_url: `${config.client_Url}/reauth`,
        return_url: `${config.client_Url}/onboarding-success`,
        type: 'account_onboarding',
      });
    } catch (error) {
      this.handleError(error, 'Error generating account link');
    }
  }

  // ✅ Create Stripe Customer
  public async createCustomer(email: string, name: string) {
    try {
      return await this.stripe().customers.create({ email, name });
    } catch (error) {
      this.handleError(error, 'Customer creation failed');
    }
  }

  // ✅ Create Checkout Session (Destination Charge for Vendor)
  public async getCheckoutSession(
    products: IProduct[],
    success_url: string,
    cancel_url: string,
    currency: string,
    customer: string,
    vendorAccountId?: string, // ✅ Vendor's Connected Account ID
    platformFeePercent: number = 10, // ✅ 10% commission
  ) {
    try {
      return await this.stripe().checkout.sessions.create({
        line_items: products,
        mode: 'payment',
        success_url,
        cancel_url,
        customer,
        payment_intent_data: vendorAccountId
          ? {
              transfer_data: {
                destination: vendorAccountId, // ✅ Vendor’s account gets payout
              },
              application_fee_amount: Math.round(
                (products[0].price_data.unit_amount * platformFeePercent) / 100,
              ),
            }
          : undefined,
        invoice_creation: { enabled: true },
      });
    } catch (error) {
      this.handleError(error, 'Error creating checkout session');
    }
  }

  // ✅ Retrieve Session
  public async getPaymentSession(session_id: string) {
    try {
      return await this.stripe().checkout.sessions.retrieve(session_id);
    } catch (error) {
      this.handleError(error, 'Error retrieving payment session');
    }
  }

  // ✅ Check Payment Status
  public async isPaymentSuccess(session_id: string) {
    try {
      const session =
        await this.stripe().checkout.sessions.retrieve(session_id);
      return session.payment_status === 'paid';
    } catch (error) {
      this.handleError(error, 'Error checking payment status');
    }
  }

  // ✅ Refund Payment
  public async refund(payment_intent: string, amount?: number) {
    try {
      return await this.stripe().refunds.create({
        payment_intent,
        ...(amount ? { amount: Math.round(Number(amount) * 100) } : {}),
      });
    } catch (error) {
      this.handleError(error, 'Error processing refund');
    }
  }
}

const StripePaymentService = new StripeService();
export default StripePaymentService;
