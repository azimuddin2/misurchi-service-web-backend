import { Types } from 'mongoose';
import { Vendor } from '../vendor/vendor.model';
import { Referral } from './referral.model';
import { sendEmail } from '../../utils/sendEmail';
import config from '../../config';
import QueryBuilder from '../../builder/QueryBuilder';

// Bring referral link
const getReferralLink = async (vendorId: Types.ObjectId) => {
  const vendor = await Vendor.findById(vendorId).select(
    'referralCode referralLink businessName',
  );

  if (!vendor) throw new Error('Vendor not found');

  if (!vendor.referralLink) {
    const link = `${config.client_Url}/signup/vendor?ref=${vendor.referralCode}`;

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

  const link =
    vendor.referralLink ||
    `${config.client_Url}/signup/vendor?ref=${vendor.referralCode}`;

  // ✅ existing sendEmail (Resend) used for both initial and resend scenarios
  await sendEmail(
    recipientEmail,
    `You have a new invitation`,
    `
  <div style="background:#f0f4ff; padding:28px; font-family:Arial,sans-serif;">
    <div style="max-width:560px; margin:auto; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">

      <!-- Top banner -->
      <div style="background:linear-gradient(135deg,#0AA84C,#078a3e); padding:32px 36px 28px; text-align:center;">
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
            style="display:inline-block; background:#0AA84C; color:#ffffff; padding:14px 36px; border-radius:8px; text-decoration:none; font-size:15px; font-weight:600;">
            Accept Invitation →
          </a>
        </div>

       
      </div>

      <!-- Footer -->
      <div style="background:#f8f9ff; padding:20px 36px; text-align:center; border-top:1px solid #eef0ff;">
        <p style="margin:0; font-size:12px; color:#bbb;">&copy; ${new Date().getFullYear()} · This is an automated message · Please do not reply</p>
      </div>

    </div>
  </div>
  `,
  );
};

// Vendor Dashboard stats
const getReferralStats = async (vendorId: Types.ObjectId, month?: string) => {
  let dateFilter: Record<string, unknown> = {};
  if (month) {
    const start = new Date(`${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    dateFilter = { completedAt: { $gte: start, $lt: end } };
  }

  const completedReferrals = await Referral.find({
    referrerId: vendorId,
    status: 'completed',
    ...dateFilter,
  }).select('businessName completedAt pointsAwarded');

  const totalPoints = completedReferrals.reduce(
    (sum, r) => sum + r.pointsAwarded,
    0,
  );

  const worthEquivalent = (totalPoints * 2.5).toFixed(2);

  const allReferrals = await Referral.find({
    referrerId: vendorId,
    ...dateFilter,
  })
    .sort({ createdAt: -1 })
    .select('businessName status pointsAwarded createdAt completedAt');

  const transactions = allReferrals.map((r, i) => ({
    transactionId: `#PAY-${String(i + 1).padStart(4, '0')}`,
    points: r.status === 'completed' ? r.pointsAwarded : 0,
    method: 'Points',
    referee: r.businessName,
    date: (r.completedAt || r.createdAt)?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    status: r.status,
  }));

  return {
    pointsPerReferral: 1,
    totalPoints,
    worthEquivalent: `$${worthEquivalent}`,
    payoutNotice: 'Request Payout Only After Earning $200.00',
    businessNames: completedReferrals.map((r) => r.businessName).join(', '),
    transactions,
  };
};

// Award referral points
const awardReferralPoint = async (vendorId: Types.ObjectId) => {
  const referral = await Referral.findOne({
    referredUserId: vendorId,
    status: 'pending',
  });

  if (!referral) return;

  referral.status = 'completed';
  referral.completedAt = new Date();
  await referral.save();

  await Vendor.findByIdAndUpdate(referral.referrerId, {
    $inc: {
      totalReferralPoints: 1,
      totalReferredUsers: 1,
    },
  });
};

const getAllVendorReferralStatsFromDB = async (
  query: Record<string, unknown>,
) => {
  const { month, ...filters } = query;

  const vendorQuery = Vendor.find({ isDeleted: false }).select(
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

  const result = vendors.map((vendor, index) => ({
    serial: index + 1,
    vendorId: vendor._id,
    name: vendor.businessName,
    referralCode: vendor.referralCode,
    totalReferredUsers: `${vendor.totalReferredUsers ?? 0} Users`,
    totalPoints: vendor.totalReferralPoints,
    worthEquivalent: `$${(vendor.totalReferralPoints * 2.5).toFixed(2)}`,
  }));

  return { meta, result };
};

const getVendorReferralDetailFromDB = async (
  vendorId: string,
  query: Record<string, unknown>,
) => {
  const referralQuery = Referral.find({ referrerId: vendorId }).select(
    'businessName createdAt status pointsAwarded',
  );

  const queryBuilder = new QueryBuilder(referralQuery, query)
    .search(['businessName'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const referrals = await queryBuilder.modelQuery;

  const result = referrals.map((r, index) => ({
    serial: index + 1,
    referredUser: r.businessName,
    dateJoined: r.createdAt?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    status: r.status === 'completed' ? 'Active' : 'Inactive',
    reward:
      r.status === 'completed'
        ? `$${(r.pointsAwarded * 2.5).toFixed(2)}`
        : '$0',
  }));

  return { meta, result };
};

export const ReferralService = {
  getReferralLink,
  emailReferralLink,
  getReferralStats,
  awardReferralPoint,
  getAllVendorReferralStatsFromDB,
  getVendorReferralDetailFromDB,
};
