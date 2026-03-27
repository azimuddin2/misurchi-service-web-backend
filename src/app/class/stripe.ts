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

class StripeServices<T> {
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
      // Unknown error types
      console.error('Unknown Error:', error);
      throw new Error(`${message} - An unknown error occurred.`);
    }
  }

  public async connectAccount(
    returnUrl: string,
    refreshUrl: string,
    accountId: string,
  ) {
    try {
      const accountLink = await this.stripe().accountLinks.create({
        account: accountId,
        return_url: returnUrl,
        refresh_url: refreshUrl,

        type: 'account_onboarding',
      });

      return accountLink;
    } catch (error) {
      this.handleError(error, 'Error connecting account');
    }
  }

  public async createPaymentIntent(
    amount: number,
    currency: string,
    payment_method_types: string[] = ['card'],
  ) {
    try {
      return await this.stripe().paymentIntents.create({
        amount: amount * 100, // Convert amount to cents
        currency,
        payment_method_types,
      });
    } catch (error) {
      this.handleError(error, 'Error creating payment intent');
    }
  }

  public async transfer(
    amount: number,
    accountId: string,
    currency: string = 'usd',
  ) {
    try {
      const balance = await this.stripe().balance.retrieve();
      const availableBalance = balance.available.reduce(
        (total, bal) => total + bal.amount,
        0,
      );

      if (availableBalance < amount) {
        console.log('Insufficient funds to cover the transfer.');
        throw new Error('Insufficient funds to cover the transfer.');
      }

      return await this.stripe().transfers.create({
        amount,
        currency,
        destination: accountId,
      });
    } catch (error) {
      this.handleError(error, 'Error transferring funds');
    }
  }

  public async refund(payment_intent: string, amount?: number) {
    try {
      if (amount) {
        return await this.stripe().refunds.create({
          payment_intent: payment_intent,
          amount: Math.round(amount),
        });
      }
      return await this.stripe().refunds.create({
        payment_intent: payment_intent,
      });
    } catch (error) {
      this.handleError(error, 'Error processing refund');
    }
  }

  public async retrieve(session_id: string) {
    try {
      // return await this.stripe().paymentIntents.retrieve(intents_id);
      return await this.stripe().checkout.sessions.retrieve(session_id);
    } catch (error) {
      this.handleError(error, 'Error retrieving session');
    }
  }

  public async getPaymentSession(session_id: string) {
    try {
      return await this.stripe().checkout.sessions.retrieve(session_id);
      // return (await this.stripe().paymentIntents.retrieve(intents_id)).status;
    } catch (error) {
      this.handleError(error, 'Error retrieving payment status');
    }
  }

  public async isPaymentSuccess(session_id: string) {
    try {
      const status = (
        await this.stripe().checkout.sessions.retrieve(session_id)
      ).status;
      return status === 'complete';
    } catch (error) {
      this.handleError(error, 'Error checking payment success');
    }
  }

  // getCheckoutSession — total থেকে fee calculate
  public async getCheckoutSession(
    products: IProduct[],
    success_url: string,
    cancel_url: string,
    currency: string,
    customer: string,
    vendorAccountId?: string,
    platformFeePercent: number = 10,
  ) {
    try {
      const lineItems = products.map((p) => ({
        price_data: p.price_data,
        quantity: p.quantity,
      }));

      // ✅ সব items এর total amount
      const totalAmount = lineItems.reduce(
        (sum, item) => sum + item.price_data.unit_amount * (item.quantity ?? 1),
        0,
      );

      const applicationFee = Math.round(
        (totalAmount * platformFeePercent) / 100,
      );

      return await this.stripe().checkout.sessions.create({
        line_items: lineItems,
        mode: 'payment',
        success_url,
        cancel_url,
        customer,
        currency,
        ...(vendorAccountId && {
          payment_intent_data: {
            application_fee_amount: applicationFee, // ✅ platform এ থাকবে
            transfer_data: { destination: vendorAccountId }, // ✅ vendor এ যাবে
          },
        }),
        invoice_creation: { enabled: true },
      });
    } catch (error) {
      this.handleError(error, 'Error creating checkout session');
    }
  }

  public async createCustomer(email: string, name: string) {
    try {
      return await this.stripe().customers.create({
        email,
        name,
        //   description: 'HandyHub.pro Customer', // Optional: for dashboard reference
        //   metadata: {
        //     platform: 'HandyHub.pro', // Custom metadata for tracking
        //   },
      });
    } catch (error) {
      this.handleError(error, 'customer creation failed');
    }
  }

  // Restricted accounts delete developer purpose
  public async deleteAllRestrictedAccounts() {
    try {
      const accounts = await this.stripe().accounts.list({ limit: 100 });

      const restrictedAccounts = accounts.data.filter(
        (acc) => !acc.charges_enabled || !acc.payouts_enabled,
      );

      const deletePromises = restrictedAccounts.map((acc) =>
        this.stripe().accounts.del(acc.id),
      );

      const results = await Promise.all(deletePromises);
      console.log(`${results.length} restricted accounts deleted`);

      return results;
    } catch (error) {
      this.handleError(error, 'Error deleting restricted accounts');
    }
  }

  public getStripe() {
    return this.stripe();
  }
}

const StripeService = new StripeServices();
export default StripeService;
