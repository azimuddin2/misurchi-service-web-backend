import AppError from '../../errors/AppError';
import { TPlan } from './plan.interface';
import { User } from '../user/user.model';
import { Plan } from './plan.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { createStripeProduct, stripe } from './plan.utils';

const createPlanIntoDB = async (payload: TPlan) => {
  // Find the admin to notify
  const isAdmin = await User.findOne({ role: 'admin' });
  if (!isAdmin || !isAdmin.email) {
    throw new AppError(404, 'Admin email not found');
  }

  // 1. Create Stripe Product & Price
  const interval = payload.validity === '1year' ? 'year' : 'month';
  const stripeData = await createStripeProduct(
    payload.name,
    payload.description,
    payload.cost,
    interval,
  );

  // 2. Add Stripe info to payload
  const planData = {
    ...payload,
    stripeProductId: stripeData.productId,
    stripePriceId: stripeData.priceId,
  };

  // 3. Save plan in DB
  const result = await Plan.create(planData);
  if (!result) {
    throw new AppError(400, 'Failed to create subscription plan');
  }

  return result;
};

const getAllPlansFromDB = async (query: Record<string, unknown>) => {
  const plansQuery = new QueryBuilder(
    Plan.find({ isDeleted: false }).populate('user'),
    query,
  )
    .search([])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await plansQuery.countTotal();
  const result = await plansQuery.modelQuery;

  return { meta, result };
};

const getPlanByIdFromDB = async (id: string) => {
  const result = await Plan.findById(id).populate('user');

  if (!result) {
    throw new AppError(404, 'This plan not found');
  }

  if (result.isDeleted === true) {
    throw new AppError(400, 'This plan has been deleted');
  }

  return result;
};

const updatePlanIntoDB = async (id: string, payload: Partial<TPlan>) => {
  const isPlanExists = await Plan.findById(id);

  if (!isPlanExists) {
    throw new AppError(404, 'This plan not exists');
  }

  if (isPlanExists.isDeleted === true) {
    throw new AppError(400, 'This plan has been deleted');
  }

  // ✅ cost বদলালে — same product, নতুন price
  if (payload.cost !== undefined) {
    const interval = isPlanExists.validity === '1year' ? 'year' : 'month';

    const newPrice = await stripe.prices.create({
      unit_amount: payload.cost * 100,
      currency: 'usd',
      recurring: { interval },
      product: isPlanExists.stripeProductId, // ✅ same productId
    });

    // পুরনো price archive
    await stripe.prices.update(isPlanExists.stripePriceId, { active: false });

    payload.stripePriceId = newPrice.id; // ✅ শুধু priceId update
    // stripeProductId same থাকবে — touch করবো না
  }

  // ✅ name বা description বদলালে — Stripe product update
  if (payload.name || payload.description) {
    await stripe.products.update(isPlanExists.stripeProductId, {
      name: payload.name || isPlanExists.name,
      description: payload.description || isPlanExists.description,
    });
  }

  const updatedPlan = await Plan.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!updatedPlan) {
    throw new AppError(400, 'Plan update failed');
  }

  return updatedPlan;
};

const deletePlanFromDB = async (id: string) => {
  const isPlanExists = await Plan.findById(id);

  if (!isPlanExists) {
    throw new AppError(404, 'Plan not found');
  }

  const result = await Plan.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new AppError(400, 'Failed to delete plan');
  }

  return result;
};

export const PlanServices = {
  createPlanIntoDB,
  getAllPlansFromDB,
  getPlanByIdFromDB,
  updatePlanIntoDB,
  deletePlanFromDB,
};
