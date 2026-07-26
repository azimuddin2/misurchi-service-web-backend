import cron from 'node-cron';
import { Subscription } from '../modules/subscription/subscription.model';
import { User } from '../modules/user/user.model';

export const startCronJobs = () => {
  // Runs every day at midnight (00:00) to check for expired subscriptions
  cron.schedule('0 0 * * *', async () => {
    console.log('🕐 Running subscription expiry check...');

    const now = new Date();

    // Find all active subscriptions that have passed their expiry date
    const expiredSubscriptions = await Subscription.find({
      status: 'active',
      expiredAt: { $lt: now },
      isDeleted: false,
    });

    for (const subscription of expiredSubscriptions) {
      const finalStatus = subscription.cancelAtPeriodEnd
        ? 'canceled'
        : 'expired';

      // Mark subscription accordingly
      await Subscription.findByIdAndUpdate(subscription._id, {
        $set: {
          status: finalStatus,
          isExpired: true,
        },
      });

      // Update user's subscription status to inactive
      await User.findByIdAndUpdate(subscription.user, {
        $set: {
          isSubscribed: false,
          subscribed: 'basic',
        },
      });
    }

    console.log(
      `✅ ${expiredSubscriptions.length} subscriptions processed (expired/canceled).`,
    );
  });
};
