import { Types } from 'mongoose';
import { Vendor } from '../vendor/vendor.model';
import { Referral } from './referral.model';
import { sendEmail } from '../../utils/sendEmail';
import config from '../../config';
import QueryBuilder from '../../builder/QueryBuilder';
import { ReferralSettings } from '../referralSettings/referralSettings.model';

// Bring referral link
const getReferralLink = async (vendorId: Types.ObjectId) => {
  const vendor = await Vendor.findById(vendorId).select(
    'referralCode referralLink businessName',
  );

  if (!vendor) throw new Error('Vendor not found');

  if (!vendor.referralLink) {
    const link = `${config.client_Url}/user-role?ref=${vendor.referralCode}`;

    await Vendor.findByIdAndUpdate(
      vendorId,
      { referralLink: link },
      { new: true },
    );

    return {
      referralCode: vendor.referralCode,
      referralLink: link,
    };
  }

  return {
    referralCode: vendor.referralCode,
    referralLink: vendor.referralLink,
  };
};

// Email the referral link to a friend
const emailReferralLink = async (
  vendorId: Types.ObjectId,
  recipientEmail: string,
) => {
  const vendor = await Vendor.findById(vendorId).select(
    'businessName referralCode referralLink',
  );

  if (!vendor) throw new Error('Vendor not found');

  // Same fallback as getReferralLink, but now we also persist it here so
  // the link doesn't get silently regenerated (and never saved) on every
  // single email send.
  let link = vendor.referralLink;

  if (!link) {
    link = `${config.client_Url}/user-role?ref=${vendor.referralCode}`;

    await Vendor.findByIdAndUpdate(
      vendorId,
      { referralLink: link },
      { new: true },
    );
  }

  await sendEmail(
    recipientEmail,
    `You have a new invitation`,
    `
  <div style="background:#f0f4ff; padding:28px; font-family:Arial,sans-serif;">
    <div style="max-width:560px; margin:auto; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">

      <!-- Top banner -->
      <div style="background-color: #1A73E8; padding:32px 36px 28px; text-align:center;">
        <div style="width:56px; height:56px; background:rgba(255,255,255,0.15); border-radius:50%; margin:0 auto 14px;">
          🎉
        </div>
        <h1 style="margin:0 0 6px; font-size:22px; font-weight:700; color:#fff;">You've Been Invited!</h1>
        <p style="margin:0; font-size:14px; color:rgba(255,255,255,0.8);">Join the platform and grow together</p>
      </div>

      <!-- Body -->
      <div style="padding:32px 36px;">
        <p style="font-size:16px; color:#1a1a1a; margin:0 0 6px; font-weight:600;">Hello! 👋</p>
        <p style="font-size:14px; color:#555; line-height:1.8; margin:0 0 24px;">
          <strong>${vendor.businessName}</strong> has invited you to join our platform.<br/>
          Click the button below to create your account.
        </p>

        <!-- CTA Button -->
      <div style="text-align:center; margin-bottom:24px;">
  <a href="${link}"
     target="_blank"
     rel="noopener noreferrer"
     style="display:inline-block; background-color:#1A73E8; color:#ffffff; padding:14px 36px; border-radius:8px; text-decoration:none; font-size:15px; font-weight:600;">
    Accept Invitation →
  </a>
</div>
      </div>

      <!-- Footer -->
      <div style="background:#f8f9ff; padding:20px 36px; text-align:center; border-top:1px solid #eef0ff;">
        <p style="margin:0; font-size:12px; color:#bbb;">&copy; ${new Date().getFullYear()} <strong>SMEVine</strong> · This is an automated message · Please do not reply</p>
      </div>

    </div>
  </div>
  `,
  );
};

// Vendor Dashboard stats
const getReferralStats = async (vendorId: Types.ObjectId, month?: string) => {
  const vendor = await Vendor.findById(vendorId).select('totalReferralPoints');

  if (!vendor) {
    throw new Error('Vendor not found');
  }

  // Get referral settings from Admin Panel
  const referralSettings = await ReferralSettings.findOne();

  if (!referralSettings) {
    throw new Error('Referral settings not configured');
  }

  const pointsPerReferral = referralSettings.pointsPerReferral;
  const pointValue = referralSettings.pointValue;

  let dateFilter: Record<string, unknown> = {};

  if (month) {
    const start = new Date(`${month}-01`);
    const end = new Date(start);

    end.setMonth(end.getMonth() + 1);

    dateFilter = {
      $or: [
        { status: 'completed', completedAt: { $gte: start, $lt: end } },
        { status: 'pending', createdAt: { $gte: start, $lt: end } },
      ],
    };
  }

  // Only NOT-YET-PAID completed referrals count toward the current
  // balance. Once paid via an approved PayoutRequest, they must drop
  // out of this figure — otherwise a vendor who already got paid would
  // still show that same reward as "current worth".
  const completedReferrals = await Referral.find({
    referrerId: vendorId,
    status: 'completed',
    paidOut: false,
    ...dateFilter,
  }).select('businessName completedAt pointsAwarded rewardValue');

  const allReferrals = await Referral.find({
    referrerId: vendorId,
    ...dateFilter,
  })
    .sort({ createdAt: -1 })
    .select(
      'businessName status pointsAwarded createdAt completedAt rewardValue',
    );

  // totalPoints must come from the SAME data set as worthEquivalent
  // (unpaid, month-filtered completed referrals) — not
  // vendor.totalReferralPoints, which is an all-time running balance
  // that can drift out of sync after payouts.
  const totalPoints = completedReferrals.reduce(
    (sum, referral) => sum + (referral.pointsAwarded ?? 0),
    0,
  );

  const worthEquivalent = completedReferrals
    .reduce((sum, referral) => sum + (referral.rewardValue ?? 0), 0)
    .toFixed(2);

  const transactions = allReferrals.map((referral, index) => ({
    transactionId: `#PAY-${String(index + 1).padStart(4, '0')}`,
    points: referral.status === 'completed' ? referral.pointsAwarded : 0,
    method: 'Points',
    referee: referral.businessName,
    date: (referral.completedAt || referral.createdAt)?.toLocaleDateString(
      'en-US',
      { month: 'short', day: 'numeric', year: 'numeric' },
    ),
    status: referral.status,
  }));

  return {
    pointsPerReferral,
    pointValue,
    totalPoints,
    worthEquivalent: `$${worthEquivalent}`,
    payoutNotice: 'Request Payout Only After Earning $200.00',
    businessNames: completedReferrals
      .map((referral) => referral.businessName)
      .join(', '),
    transactions,
  };
};

// Award referral points
const awardReferralPoint = async (referredUserId: Types.ObjectId) => {
  // Get referral settings from Admin Panel
  const referralSettings = await ReferralSettings.findOne();

  if (!referralSettings) {
    throw new Error('Referral settings not configured');
  }

  // Exact points configured in Admin Panel
  const pointsPerReferral = referralSettings.pointsPerReferral;
  const pointValue = referralSettings.pointValue;
  const rewardValue = pointsPerReferral * pointValue;

  // Atomic find-and-update: only ONE call can ever transition a given
  // pending referral to completed. If this runs twice concurrently
  // (webhook retry, duplicate event, etc.) the second call simply finds
  // nothing to update and returns early, instead of double-awarding
  // points to the vendor.
  const referral = await Referral.findOneAndUpdate(
    { referredUserId, status: 'pending' },
    {
      status: 'completed',
      completedAt: new Date(),
      pointsAwarded: pointsPerReferral,
      pointValueAtCompletion: pointValue,
      rewardValue,
    },
    { new: true },
  );

  if (!referral) {
    console.log(
      '❌ [awardReferralPoint] No pending referral found for user:',
      referredUserId,
    );
    return;
  }

  const updatedVendor = await Vendor.findByIdAndUpdate(
    referral.referrerId,
    {
      $inc: {
        totalReferralPoints: pointsPerReferral,
        totalReferredUsers: 1,
      },
    },
    { new: true },
  );

  if (!updatedVendor) {
    // Referral is already marked completed at this point, so we can't
    // silently pretend nothing happened — log loudly so this
    // inconsistent state (completed referral, missing vendor) can be
    // investigated and reconciled.
    console.error(
      '⚠️ [awardReferralPoint] Referral marked completed but vendor not found:',
      referral.referrerId,
    );
    return;
  }

  console.log('✅ [awardReferralPoint] Vendor updated:', updatedVendor._id, {
    pointsAwarded: pointsPerReferral,
    totalReferralPoints: updatedVendor.totalReferralPoints,
    totalReferredUsers: updatedVendor.totalReferredUsers,
  });
};

const getAllVendorReferralStatsFromDB = async (
  query: Record<string, unknown>,
) => {
  const { month, ...filters } = query;

  const vendorQuery = Vendor.find({
    isDeleted: false,
  }).select(
    'businessName email referralCode totalReferralPoints totalReferredUsers',
  );

  const queryBuilder = new QueryBuilder(vendorQuery, filters)
    .search(['businessName', 'email', 'referralCode'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const vendors = await queryBuilder.modelQuery;

  const vendorIds = vendors.map((vendor) => vendor._id);

  const unpaidTotalsByVendor = await Referral.aggregate([
    {
      $match: {
        referrerId: { $in: vendorIds },
        status: 'completed',
        paidOut: false,
      },
    },
    {
      $group: {
        _id: '$referrerId',
        totalPoints: { $sum: '$pointsAwarded' },
        worthEquivalent: { $sum: '$rewardValue' },
      },
    },
  ]);

  const totalsMap = new Map(
    unpaidTotalsByVendor.map((entry) => [
      entry._id.toString(),
      {
        totalPoints: entry.totalPoints,
        worthEquivalent: entry.worthEquivalent,
      },
    ]),
  );

  const result = vendors.map((vendor, index) => {
    const totals = totalsMap.get((vendor._id as Types.ObjectId).toString()) ?? {
      totalPoints: 0,
      worthEquivalent: 0,
    };

    return {
      serial: index + 1,
      vendorId: vendor._id,
      name: vendor.businessName,
      referralCode: vendor.referralCode,
      totalReferredUsers: `${vendor.totalReferredUsers ?? 0} Users`,
      totalPoints: totals.totalPoints,
      worthEquivalent: `$${totals.worthEquivalent.toFixed(2)}`,
    };
  });

  return {
    meta,
    result,
  };
};

const getVendorReferralDetailFromDB = async (
  vendorId: string,
  query: Record<string, unknown>,
) => {
  const referralQuery = Referral.find({
    referrerId: vendorId,
  }).select('businessName createdAt status pointsAwarded rewardValue');

  const queryBuilder = new QueryBuilder(referralQuery, query)
    .search(['businessName'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const referrals = await queryBuilder.modelQuery;

  const result = referrals.map((referral, index) => {
    const pointsAwarded = referral.pointsAwarded ?? 0;

    // Use the reward snapshot taken at completion time instead of
    // recalculating against the admin panel's current pointValue, so a
    // later rate change doesn't retroactively change what a vendor
    // already earned.
    const reward =
      referral.status === 'completed'
        ? `$${(referral.rewardValue ?? 0).toFixed(2)}`
        : '$0.00';

    return {
      serial: index + 1,

      referredUser: referral.businessName,

      dateJoined: referral.createdAt?.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),

      status: referral.status === 'completed' ? 'Active' : 'Inactive',

      points: pointsAwarded,

      reward,
    };
  });

  return {
    meta,
    result,
  };
};

export const ReferralService = {
  getReferralLink,
  emailReferralLink,
  getReferralStats,
  awardReferralPoint,
  getAllVendorReferralStatsFromDB,
  getVendorReferralDetailFromDB,
};
