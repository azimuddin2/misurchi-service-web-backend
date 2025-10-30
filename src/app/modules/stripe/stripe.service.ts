// src/modules/stripe/stripe.service.ts
import AppError from '../../errors/AppError';
import { Vendor } from '../vendor/vendor.model';
import httpStatus from 'http-status';
import { VendorStripeAccount } from './stripe.model';
import StripePaymentService from '../../class/stripe';

const createVendorStripeAccount = async (vendorId: string) => {
  const vendor = await Vendor.findById({ _id: vendorId });
  if (!vendor) throw new AppError(httpStatus.NOT_FOUND, 'Vendor not found');

  // check if already exists
  const existing = await VendorStripeAccount.findOne({ vendor: vendorId });
  if (existing) {
    const link = await StripePaymentService.generateAccountLink(
      existing.stripeAccountId,
    );
    return {
      existing: true,
      onboardingUrl: link?.url,
      message: 'Stripe account already exists',
    };
  }

  // create connect account
  const stripeAccount = await StripePaymentService.createConnectAccount(
    vendor.email,
  );
  if (!stripeAccount?.id) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Stripe account creation failed',
    );
  }

  // save to DB
  const newRecord = await VendorStripeAccount.create({
    vendor: vendorId,
    stripeAccountId: stripeAccount.id,
    email: vendor.email,
    status: 'pending',
  });

  const link = await StripePaymentService.generateAccountLink(stripeAccount.id);

  return {
    account: newRecord,
    onboardingUrl: link?.url,
  };
};

const getVendorStripeAccountStatus = async (vendorId: string) => {
  const record = await VendorStripeAccount.findOne({ vendor: vendorId });
  if (!record)
    throw new AppError(httpStatus.NOT_FOUND, 'Vendor Stripe account not found');

  const stripeAccount = await StripePaymentService.retrieveAccount(
    record.stripeAccountId,
  );

  // update relevant fields
  record.detailsSubmitted = Boolean((stripeAccount as any)?.details_submitted);
  record.payoutsEnabled = Boolean((stripeAccount as any)?.payouts_enabled);
  record.status = (stripeAccount as any)?.payouts_enabled
    ? 'verified'
    : 'restricted';
  await record.save();

  return record;
};

export const StripeService = {
  createVendorStripeAccount,
  getVendorStripeAccountStatus,
};
