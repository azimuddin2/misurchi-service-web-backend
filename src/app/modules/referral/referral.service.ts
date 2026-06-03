import { Types } from 'mongoose';
import { Vendor } from '../vendor/vendor.model';
import { Referral } from './referral.model';
import { sendEmail } from '../../utils/sendEmail';
import config from '../../config';

// ✅ 1. Referral link
const getReferralLink = async (vendorId: Types.ObjectId) => {
  const vendor = await Vendor.findById(vendorId).select(
    'referralCode referralLink businessName',
  );

  if (!vendor) throw new Error('Vendor not found');

  // যদি link না থাকে তাহলে তৈরি করো
  if (!vendor.referralLink) {
    vendor.referralLink = `${config.client_Url}/signup/vendor?ref=${vendor.referralCode}`;
    await vendor.save();
  }

  return {
    referralCode: vendor.referralCode,
    referralLink: vendor.referralLink,
  };
};

// ✅ 2. Email referral link
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

  // ✅ existing sendEmail (Resend) use করছি
  await sendEmail(
    recipientEmail,
    `${vendor.businessName} invited you to join!`,
    `
    <div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2>You've been invited! 🎉</h2>
      <p><strong>${vendor.businessName}</strong> wants you to join our platform.</p>
      <a href="${link}" style="
        display:inline-block;
        background:#1ab394;
        color:white;
        padding:12px 28px;
        border-radius:6px;
        text-decoration:none;
        font-weight:bold;
        margin:16px 0;
      ">Sign Up Now</a>
      <p style="color:#888;font-size:13px">Or copy: ${link}</p>
    </div>
    `,
  );
};

// ✅ 3. Dashboard stats
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

// ✅ 4. Transaction complete হলে point দাও
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
    $inc: { totalReferralPoints: 1 },
  });
};

export const ReferralService = {
  getReferralLink,
  emailReferralLink,
  getReferralStats,
  awardReferralPoint,
};
