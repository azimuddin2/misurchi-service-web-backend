# SmeVine — Vendor & Customer Management Platform (Backend)

A backend API that empowers small and medium-sized businesses with a simple, no-code way to manage their services, products, and customer interactions in one place. Vendors can list offerings, accept bookings and payments online, track sales, manage teams, and build lasting customer relationships. Customers can browse vendors, book appointments, purchase products, and share reviews.

> **Vision:** Make digital commerce and client management accessible for every business, regardless of size or technical ability.

---

## Table of Contents

- [Technology Stack](#technology-stack)
- [Platform Overview](#platform-overview)
- [User Roles](#user-roles)
- [Vendor Plans](#vendor-plans)
- [Core Features](#core-features)
  - [Vendor Interface](#vendor-interface)
  - [Advanced Plan Features](#advanced-plan-features)
  - [End User (Buyer) Interface](#end-user-buyer-interface)
  - [Admin Panel](#admin-panel)
- [Business Rules](#business-rules)
- [Dependency Usage](#dependency-usage)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)

---

## Technology Stack

| Layer            | Technology                         |
| ---------------- | ---------------------------------- |
| Language         | TypeScript                         |
| Runtime          | Node.js                            |
| Framework        | Express.js                         |
| Database         | MongoDB                            |
| ODM              | Mongoose                           |
| Real-time        | Socket.IO                          |
| Payments         | Stripe                             |
| File Storage     | AWS S3                             |
| Email            | Nodemailer / Resend                |
| Validation       | Zod                                |
| Scheduling       | node-cron                          |

---

## Platform Overview

**Vendors can:**

- List and manage products and services
- Accept bookings and payments online
- Track transactions, sales, and customer activity
- Assign team roles and manage shared calendars
- Engage with clients through chat and notifications
- Build relationships through reviews and feedback

**Customers can:**

- Browse vendor profiles
- Book appointments or purchase products directly online
- Receive automated confirmations and reminders
- Reschedule bookings if needed
- Share their experiences via reviews

---

## User Roles

| Role                | Description                                                                 |
| ------------------- | --------------------------------------------------------------------------- |
| **Vendor (Owner)**  | Registers the business, manages offerings, plan, payouts, and team          |
| **Manager**         | Team role (Advanced Plan). Full operational access incl. refund approval    |
| **Supervisor**      | Team role (Advanced Plan). Same as Manager, but cannot approve refunds      |
| **Team Member**     | Team role (Advanced Plan). Day-to-day tasks, appointments, and messaging    |
| **End User (Buyer)**| Browses vendors, books services, purchases products, leaves reviews         |
| **Platform Admin**  | Manages users, categories, subscriptions, earnings, referrals, support, and platform content via the Admin Panel |

### Team Role Permissions

| Permission                          | Team Member | Supervisor | Manager |
| ----------------------------------- | :---------: | :--------: | :-----: |
| Assign tasks                        |      ✅     |     ✅     |    ✅   |
| Create appointments                 |      ✅     |     ✅     |    ✅   |
| Cancel / reschedule appointments    |      ✅     |     ✅     |    ✅   |
| Respond to messages / inquiries     |      ✅     |     ✅     |    ✅   |
| Filter transaction history          |      ✅     |     ✅     |    ✅   |
| Initiate refunds                    |      ✅     |     ✅     |    ✅   |
| Add / edit users                    |      ❌     |     ✅     |    ✅   |
| Create / edit offerings             |      ❌     |     ✅     |    ✅   |
| Assign discounts                    |      ❌     |     ✅     |    ✅   |
| Approve refunds                     |      ❌     |     ❌     |    ✅   |

---

## Vendor Plans

| Feature                    | Basic (Free)  | Advanced (Paid Subscription)        |
| -------------------------- | ------------- | ----------------------------------- |
| Cost                       | Free          | Monthly / Yearly                    |
| Validity                   | Unlimited     | Limited to paid subscription period |
| Max Services               | 10            | Unlimited                           |
| Max Products               | 10            | Unlimited                           |
| Transaction Commission     | 7.5%          | 5%                                  |
| Highlighted Offerings      | Max 1         | Max 5                               |
| Team Members               | ❌            | ✅                                  |
| Shared Calendar            | ❌            | ✅                                  |
| Task Hub                   | ❌            | ✅                                  |
| Video Upload for Offerings | ❌            | ✅                                  |
| Detailed Sales Analytics   | ❌            | ✅                                  |
| Priority Support           | ❌            | ✅                                  |
| Referral Rewards           | Basic referral| ✅                                  |

**Subscription cancellation:** the plan remains active until the current billing cycle ends and does not auto-renew afterward.

---

## Core Features

### Vendor Interface

1. **Authentication & Registration**
   - Register via Gmail, phone number, or manual form
   - Gmail / phone registration sends a confirmation link, then redirects to profile completion
   - Manual form includes secure password creation with strength suggestions
   - Login via Gmail, phone (with verification), or email + password
   - After login/registration, vendors land on the plan/subscription page
   - After profile setup, vendors choose to list **services**, **products**, or **both**

2. **Password Reset**
   - Reset via registered email or phone
   - Reset link valid for **30 minutes**
   - Optional OTP verification before showing the reset form
   - Password rules: min 8 characters, at least one uppercase letter, one number, one special character
   - Confirmation message and redirect to login on success

3. **Dashboard**
   - Total sales, pending appointments/orders, upcoming tasks/commitments
   - Earnings summary, recent messages, highlighted offerings
   - Quick shortcuts (Manage Offerings, Schedule Appointment, Transaction History, Task Hub*, Shared Calendar*)
   - Alert indicators: low stock, missed messages, cancelled/rescheduled appointments
   - Layout adapts to Basic vs Advanced plan

4. **Profile Management**
   - View/edit business name, address, contact number, description, hours, contact person, refund policy, email
   - Upload/update profile picture
   - Copy and share a public profile link
   - Email change requires a confirmation link to the new email **or** a security question (set during registration)

5. **Manage Offerings (Products & Services)**
   - Add, edit, filter offerings; vendor-defined categories only (no system pre-listed categories)
   - **Products:** category, name, quantity, price, size, image, color, discount (%), description (max 500 chars), status
   - **Services:** category, name, price, image, duration, discount (%), description (max 500 chars), status
   - **Status options:** Available, Out of Stock, TBC, Discontinued (affects buyer visibility)
   - **Highlighting:** boosted visibility with labels (Sales, New Arrival, Black Friday Deals, etc.)

6. **Activity Center**
   - View commitments by daily / weekly / monthly view
   - Cancel or reschedule with confirmation prompt and success message
   - Quick message to buyer
   - Status colors: Scheduled/Order = Orange, Confirmed/Shipped = Green, Cancelled = Red, Rescheduled/Delayed = Grey

7. **Transaction History**
   - **Sales:** filter by Transaction ID, status, date range; shows offering name, ID, date, price, size/duration, advisor (Advanced only), status
   - **Subscription:** plan name, amount, start/expiry date, status, and action (Basic → Upgrade only, Advanced → Cancel only)

8. **Payouts**
   - Total earnings, available balance, pending balance
   - Payout history with filters (date range, transaction ID, status: Paid / Pending / Failed)
   - Payout methods: Bank Transfer, Mobile Money, other options
   - Confirmation prompt, notification + email on request; failure reason and next steps on failed payouts

9. **Refer and Earn**
   - Unique referral link (copy or email)
   - Earn a point per successful referral (referred user signs up and completes a transaction)
   - Shows points per referral, total points, equivalent worth, and referee business names

10. **Contact Us (Feedback)**
    - Emoji/rating reaction and feedback (up to 500 chars)
    - Feedback history log; platform team replies with status tags: Reviewed, In Progress, Resolved
    - Vendor follow-up (up to 300 chars) and mark response as helpful / not helpful

11. **Notifications (Bell Icon)**
    - Unread badge count, dropdown/side panel, mark as read / clear all, newest first
    - Types: new messages, appointment requests/changes, order updates, team activity*, feedback responses, platform announcements

12. **Messages**
    - Threaded conversations between users and vendors with new message notifications

### Advanced Plan Features

- **Team Management:** add members, assign roles (Team Member / Manager / Supervisor), edit or remove at any time; list shows profile picture, name, role, specialty
- **Shared Calendar:** view all users' appointments (day / week / month), assign/schedule/reschedule from the calendar
  - Orange: scheduled without payment · Green: confirmed (paid) · Red: cancelled · Grey: rescheduled
- **Task Hub (Kanban):** columns — `To-Do`, `In Progress`, `Needs Review`, `Blocked/Dependencies`, `Obsolete`, `Done`
  - Create tasks with title, description, estimated completion, assignee
  - Assignee is notified; can move or reassign tasks; filter by status and name
- **Reschedule to another team member** with notifications to all affected members
- **Video uploads** for products and services

### End User (Buyer) Interface

1. **Registration & Login**
   - Sign in with email or phone; unrecognized users are routed to registration
   - Registration: first/last name, email or phone, password (min 8 chars, upper, lower, number, special character)
   - Verification code/link sent; logged in after successful verification

2. **Dashboard / Home**
   - Carousel of highlighted services and products, followed by non-highlighted offerings
   - Search by item name; filter by city and zip code; geolocation ("near me") support

3. **Profile**
   - Edit name, email, phone, address (optional), photo (optional)
   - Success/error confirmations with exact error messages
   - Email/phone changes require confirmation link or security check

4. **My Requests**
   - View all orders and service requests
   - Cancel/reschedule services and cancel orders, with vendor policy shown and continue/discontinue prompt
   - Message vendor; leave a review for completed transactions if not yet submitted

5. **Notifications & Messages**
   - Bell icon with unread badge: order updates, appointment reminders/changes, vendor messages, promotions
   - Threaded messaging with vendors

6. **Contact Support**
   - Reaction/rating, comments (up to 500 chars), feedback history, follow-up (up to 300 chars), helpful / not helpful

7. **Booking & Purchase Journey**
   - **Services:** choose duration → view price → check availability on calendar → select date/time → checkout
     - Availability colors: Green = available, Yellow = limited, Red = fully booked, Grey = past/inactive
   - **Products:** choose size/color → update quantity → add to cart → checkout

8. **Vendor Shared Link Workflow**
   - Opens vendor page with search bar, highlighted carousel, categorized offerings, full profile (name, address, contact, hours, policies, chat)
   - "View Team" section (Advanced Plan) with photo, name, role, specialty, chat and schedule icons

9. **Checkout**
   - **Products:** full name, email, phone, shipping address, payment method; must acknowledge cancellation & return policies; confirmation email with reference ID; vendor notified
   - **Services:** full name, email, phone, service, duration, date/time, payment option (**Pay Full**, **Pay Partial**, **Pay Later**); must review cancellation & reschedule policies
     - Pay Full / Partial → confirmation email securing the appointment
     - Pay Later → appointment scheduled but not guaranteed; reminder email with link to complete payment

### Admin Panel

A web dashboard for platform administrators (route: `/admin/dashboard`).

**Dashboard**

- **Total User** and **Total Earning** cards (last 30 days) with growth percentage
- **User Overview** chart: new users per month, filterable by year
- **Earning Overview** chart: total earnings per month, year-over-year comparison, filterable by year
- **Users table:** serial, name, email, phone, account type (e.g. `Team_member`), status, date of join
- Notification bell with unread count, and admin profile menu

**Sidebar Modules**

| Module                | Purpose                                                                              |
| --------------------- | ------------------------------------------------------------------------------------ |
| Dashboard             | Platform-wide stats and charts                                                       |
| Manage Account        | View and manage vendor / end-user / team accounts (status, details)                  |
| Recommended Type      | Manage recommended business/offering types shown to users                            |
| Service Category      | Manage service categories                                                            |
| Product Category      | Manage product categories                                                            |
| Earning               | Platform earnings from commissions and subscriptions                                 |
| Manage Subscription   | Manage Basic / Advanced plan settings and vendor subscriptions                       |
| Refer & Earn          | Referral program overview and tracking                                               |
| Refer Payout Request  | Review and approve/reject referral payout requests                                   |
| Referral Settings     | Configure referral points and their cash-equivalent value                            |
| Customer Support      | Respond to vendor/user feedback and set status tags (Reviewed / In Progress / Resolved) |
| Messages              | Admin messaging                                                                      |
| Manage FAQs           | Create, edit, and delete FAQs                                                        |
| Contact Info          | Manage platform contact details                                                      |
| Edit Profile          | Admin profile management                                                             |
| Settings              | Privacy, Policy, Terms of Use, About Us (content management)                         |

---

## Business Rules

- Commission is charged per transaction: **7.5%** on Basic, **5%** on Advanced.
- Basic plan limits: 10 services, 10 products, 1 highlighted offering.
- Highlighted offerings are boosted in buyer-facing views.
- Password reset links expire after **30 minutes**.
- Unpaid service bookings remain *Scheduled (Orange)* and may change without payment confirmation; reminders are triggered while payment is pending.
- Cancelled subscriptions stay active until the end of the billing cycle and do not renew.
- A referral point is awarded only after the referred user signs up **and** completes a transaction.
- Offering status (Available / Out of Stock / TBC / Discontinued) controls buyer visibility.
- Vendors create their own categories per the client spec; the admin-managed Service/Product Categories (`serviceType` / `productType` modules) provide the platform-level types.
- Plan-gated features (team, shared calendar, task hub, video upload, analytics) must be enforced on the server, not only in the UI.

---

## Dependency Usage

| Package                                   | Purpose                                                        |
| ----------------------------------------- | -------------------------------------------------------------- |
| `express`                                 | HTTP server and routing                                        |
| `mongoose`                                | MongoDB models and queries                                     |
| `zod`                                     | Request validation                                             |
| `jsonwebtoken`, `bcrypt`                  | Authentication tokens and password hashing                     |
| `cookie-parser`, `cors`                   | Cookie handling and cross-origin configuration                 |
| `socket.io`                               | Real-time messaging and notifications                          |
| `stripe`                                  | Payments (full / partial), subscriptions, commission handling  |
| `@aws-sdk/client-s3`, `@aws-sdk/lib-storage` | Image and video storage on S3                               |
| `multer`                                  | Multipart file upload handling                                 |
| `nodemailer`, `resend`                    | Transactional emails (confirmations, reminders, reset links)   |
| `node-cron`                               | Scheduled jobs (appointment and payment reminders, expirations)|
| `dayjs`, `luxon`, `moment`                | Date/time handling for bookings, availability, and timezones   |
| `libphonenumber-js`                       | Phone number parsing and validation                            |
| `uuid`                                    | Unique IDs (transaction refs, referral codes)                  |
| `http-status`                             | Consistent HTTP status codes                                   |
| `dotenv`                                  | Environment configuration                                      |
| `node-fetch`                              | Outbound HTTP requests                                         |

---

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- MongoDB (local or Atlas)
- Stripe account, AWS S3 bucket, and an email provider (Resend or SMTP)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd <project-folder>

# Install dependencies
npm install

# Create your environment file
cp .env.example .env
```

### Run

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start
```

---

## Environment Variables

Create a `.env` file in the project root with the following keys:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/your-db

# Auth
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=
JWT_REFRESH_EXPIRES_IN=
BCRYPT_SALT_ROUNDS=10

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# AWS S3
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

# Email
RESEND_API_KEY=
EMAIL_FROM=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# App URLs
CLIENT_URL=http://localhost:3000
```

---

## Project Structure

```text
misurchi-service-web-backend/
├── src/
│   ├── app/
│   │   ├── builder/            # query builder / reusable builders
│   │   ├── class/              # shared classes
│   │   ├── config/             # env, db, stripe, s3 setup
│   │   ├── constant/           # shared constants / enums
│   │   ├── errors/             # custom error classes
│   │   ├── helpers/            # helper functions
│   │   ├── interface/          # shared TypeScript interfaces
│   │   ├── middlewares/        # auth, role/plan guards, validation, error handler
│   │   ├── modules/            # feature modules (see below)
│   │   ├── routes/             # central route registry
│   │   └── utils/              # utilities (mailer, uploader, date, phone)
│   ├── app.ts                  # Express app setup
│   ├── server.ts               # server bootstrap + DB connection
│   └── socket.ts               # Socket.IO setup and events
├── dist/                       # compiled output
├── .env
├── .gitignore
├── .prettierrc.json
├── package.json
├── tsconfig.json
└── README.md
```

### Modules

Each feature lives in its own folder under `src/app/modules/`.

| Group                    | Modules                                                                 |
| ------------------------ | ----------------------------------------------------------------------- |
| **Auth & Users**         | `auth`, `otp`, `user`, `vendor`, `teamMember`                           |
| **Offerings**            | `product`, `productType`, `serviceType`, `recommendedType`, `imageUpload` |
| **Booking & Orders**     | `booking`, `order`, `task`                                              |
| **Payments & Finance**   | `payment`, `stripe`, `subPayment`, `payoutRequest`, `taxSummary`        |
| **Plans & Subscriptions**| `plan`, `packages`, `subscription`                                      |
| **Referral**             | `referral`, `referralSettings`                                          |
| **Communication**        | `chat`, `message`, `notification`, `follow`                             |
| **Feedback & Support**   | `review`, `support`, `faq`, `contactInfo`                               |
| **Policies & Content**   | `policy`, `privacy`, `terms`, `about`, `cancellationPolicy`, `returnPolicy` |
| **Admin**                | `dashboard`                                                             |

### Module Pattern

```text
modules/<name>/
├── <name>.interface.ts     # TypeScript types
├── <name>.model.ts         # Mongoose schema & model
├── <name>.validation.ts    # Zod schemas
├── <name>.service.ts       # business logic / DB access
├── <name>.controller.ts    # request/response handling
└── <name>.route.ts         # Express routes
```

---

## License

This project is proprietary. All rights reserved.