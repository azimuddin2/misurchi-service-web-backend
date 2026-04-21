import { Router } from 'express';
import { UserRoutes } from '../modules/user/user.route';
import { AuthRoutes } from '../modules/auth/auth.route';
import { OtpRoutes } from '../modules/otp/otp.route';
import { ProductRoutes } from '../modules/product/product.route';
import { PackagesRoutes } from '../modules/packages/packages.route';
import { VendorRoutes } from '../modules/vendor/vendor.route';
import { TaskRoutes } from '../modules/task/task.route';
import { ReviewRoutes } from '../modules/review/review.route';
import { BookingRoutes } from '../modules/booking/booking.route';
import { OrderRoutes } from '../modules/order/order.route';
import { PaymentRoutes } from '../modules/payment/payment.route';
import { TermsRoutes } from '../modules/terms/terms.route';
import { PrivacyRoutes } from '../modules/privacy/privacy.route';
import { AboutRoutes } from '../modules/about/about.route';
import { PolicyRoutes } from '../modules/policy/policy.route';
import { ServiceTypeRoutes } from '../modules/serviceType/serviceType.route';
import { ProductTypeRoutes } from '../modules/productType/productType.route';
import { PlanRoutes } from '../modules/plan/plan.route';
import { DashboardRoutes } from '../modules/dashboard/dashboard.route';
import { SupportRoutes } from '../modules/support/support.route';
import { NotificationRoutes } from '../modules/notification/notification.route';
import { SubPaymentsRoutes } from '../modules/subPayment/sub-payment.route';
import { SubscriptionRoutes } from '../modules/subscription/subscription.route';
import { RecommendedTypeRoutes } from '../modules/recommendedType/recommendedType.route';
import { FollowRoutes } from '../modules/follow/follow.route';
import { ImageUploadRoutes } from '../modules/imageUpload/imageUpload.route';
import { StripeRoute } from '../modules/stripe/stripe.route';
import { CancellationPolicyRoutes } from '../modules/cancellationPolicy/cancellationPolicy.route';
import { ReturnPolicyRoutes } from '../modules/returnPolicy/returnPolicy.route';
import { TeamMemberRoutes } from '../modules/teamMember/teamMember.route';

const router = Router();

const moduleRoutes = [
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/vendors',
    route: VendorRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/otp',
    route: OtpRoutes,
  },
  {
    path: '/product-type',
    route: ProductTypeRoutes,
  },
  {
    path: '/products',
    route: ProductRoutes,
  },
  {
    path: '/service-type',
    route: ServiceTypeRoutes,
  },
  {
    path: '/recommended-type',
    route: RecommendedTypeRoutes,
  },
  {
    path: '/services',
    route: PackagesRoutes,
  },
  {
    path: '/team-members',
    route: TeamMemberRoutes,
  },
  {
    path: '/tasks',
    route: TaskRoutes,
  },
  {
    path: '/reviews',
    route: ReviewRoutes,
  },
  {
    path: '/bookings',
    route: BookingRoutes,
  },
  {
    path: '/orders',
    route: OrderRoutes,
  },
  {
    path: '/payments',
    route: PaymentRoutes,
  },
  {
    path: '/sub-payments',
    route: SubPaymentsRoutes,
  },
  {
    path: '/terms',
    route: TermsRoutes,
  },
  {
    path: '/privacy',
    route: PrivacyRoutes,
  },
  {
    path: '/about',
    route: AboutRoutes,
  },
  {
    path: '/policy',
    route: PolicyRoutes,
  },
  {
    path: '/cancellation-policy',
    route: CancellationPolicyRoutes,
  },
  {
    path: '/return-policy',
    route: ReturnPolicyRoutes,
  },
  {
    path: '/plans',
    route: PlanRoutes,
  },
  {
    path: '/dashboard',
    route: DashboardRoutes,
  },
  {
    path: '/supports',
    route: SupportRoutes,
  },
  {
    path: '/notifications',
    route: NotificationRoutes,
  },
  {
    path: '/subscriptions',
    route: SubscriptionRoutes,
  },
  {
    path: '/follow',
    route: FollowRoutes,
  },
  {
    path: '/upload-images',
    route: ImageUploadRoutes,
  },
  {
    path: '/stripe',
    route: StripeRoute,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
