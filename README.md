### Stripe Subscription Implementation Flow with MongoDB/Mongoose
 
Ami tomake clear kore bujhacchi step by step. Tomar requirement onujayi, package gulo different duration-er (e.g., 1 month, 6 months, 1 year) but subscription ta **monthly recurring** hobe, meaning Stripe-e price create korar somoy `recurring.interval = 'month'` and `interval_count = 1` set korbe, jar fole prottek mashe billing hobe. Kintu duration limit korar jonno (e.g., 6 months-er jonno sudhu 6 ta payment), tumi **webhook** use kore payment count track korbe DB-te, ar count puro hole subscription cancel korbe API diye.
 
Ei system-e subscription indefinite na, limited cycles-er jonno – eta Stripe built-in na, tai webhook diye handle korte hobe. (Alternative: Stripe Subscription Schedules use kora jay, kintu eta complex, ar webhook diye simple.)
 
#### Do you need to create Stripe Product and Price dynamically?
Ha, **dynamic vabe create kora lagbe**. Karon admin panel theke notun package create hole (with custom name, monthly price, duration), seta Stripe-e reflect korar jonno:
- Ekta notun **Product** create korbe (package name diye).
- Tar sathe **Price** attach korbe (monthly amount, recurring monthly).
- Ei product_id ar price_id ta tomader MongoDB Package model-e save korbe.
 
Jodi sob package-er monthly price same hoy, tahole ekta-i Product/Price reuse kora jay, kintu admin custom package banabe bole assume kori different price/description, tai dynamic better.
 
#### Overall System Setup
- **Backend**: Node.js with Stripe SDK, Mongoose for MongoDB.
- **Models** (Mongoose):
  - `Package`: { name: String, durationMonths: Number, monthlyPrice: Number, stripeProductId: String, stripePriceId: String }
  - `UserSubscription`: { userId: ObjectId, packageId: ObjectId, stripeSubscriptionId: String, paymentCount: Number (default 0), status: String ('active'/'canceled'), expirationDate: Date }
- **Stripe Setup**: Secret key backend-e, webhook endpoint setup (e.g., `/webhook/stripe`), ar test mode-e CLI diye local test korbe (`stripe listen --forward-to localhost:3000/webhook/stripe`).
- **Assumption**: User subscription-er jonno Stripe Checkout use korchi (frontend theke redirect), karon eta payment collect kore easily. Jodi server-side Payment Element use koro, flow similar.
 
#### API Flow Chart
Ami text-based flowchart diye bujhacchi (ASCII art). Eta sequential: Kon API ki trigger kore.
 
```
Admin Panel (Frontend) ─┐
                       │
                       ▼
POST /api/packages (Backend API: Create Package)
  │
  ├── Create Stripe Product (stripe.products.create({name: packageName}))
  │     │
  │     └── Get product_id
  │
  ├── Create Stripe Price (stripe.prices.create({product: product_id, unit_amount: monthlyPrice*100, currency: 'usd', recurring: {interval: 'month', interval_count: 1}}))
  │     │
  │     └── Get price_id
  │
  └── Save to MongoDB (new Package({..., stripeProductId, stripePriceId}).save())
        │
        └── Response: Package created successfully
 
User (Frontend) ─┐
                 │
                 ▼
POST /api/subscribe (Backend API: Start Subscription)
  │
  ├── Find Package by ID (mongoose: Package.findById(packageId))
  │     │
  │     └── Get price_id, durationMonths
  │
  ├── Create Stripe Customer if not exists (stripe.customers.create({email: userEmail})) or retrieve existing
  │     │
  │     └── Get customer_id
  │
  ├── Create Checkout Session (stripe.checkout.sessions.create({
  │       customer: customer_id,
  │       mode: 'subscription',
  │       line_items: [{price: price_id, quantity: 1}],
  │       success_url: '...', cancel_url: '...'
  │     }))
  │     │
  │     └── Get session_id
  │
  └── Response: {sessionId} → Frontend redirects to Stripe Checkout (stripe.redirectToCheckout({sessionId}))
 
Stripe Checkout Completed (User pays first month) ─┐
                                                 │
                                                 ▼
Webhook: /webhook/stripe (Event: 'checkout.session.completed')
  │
  ├── Verify signature (stripe.webhooks.constructEvent(req.body, signature, endpointSecret))
  │
  ├── Get subscription_id from event.data.object.subscription
  │
  ├── Create UserSubscription in DB (new UserSubscription({userId, packageId, stripeSubscriptionId, paymentCount: 1, status: 'active'}).save())
  │     │  (First payment already succeeded in checkout)
  │     └── Calculate expiration: e.g., expirationDate = now + durationMonths months (but webhook will handle actual)
  │
  └── No response needed (200 OK to Stripe)
 
Every Monthly Payment ─┐
                       │
                       ▼
Webhook: /webhook/stripe (Event: 'invoice.payment_succeeded')
  │
  ├── Verify signature (same as above)
  │
  ├── Get subscription_id from event.data.object.subscription
  │
  ├── Find UserSubscription by stripeSubscriptionId (mongoose)
  │
  ├── Update DB: paymentCount += 1, update expiration or access
  │
  ├── If paymentCount >= durationMonths:
  │     │
  │     └── Cancel Subscription (stripe.subscriptions.cancel(subscription_id))
  │           │
  │           └── Update DB: status = 'canceled'
  │
  └── 200 OK to Stripe
 
Subscription Canceled (Auto or Manual) ─┐
                                        │
                                        ▼
Webhook: /webhook/stripe (Event: 'customer.subscription.canceled' or 'updated' with status='canceled')
  │
  ├── Verify
  │
  ├── Find UserSubscription
  │
  ├── Update DB: status = 'canceled', revoke access
  │
  └── 200 OK
```
 
#### Explanation of Key Parts
1. **Package Creation Flow**:
   - Admin panel theke form submit hole, backend-e Stripe API call kore product ar price banabe.
   - Example Code (Node.js with Stripe):
     ```javascript:disable-run
     const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
     const Package = require('../models/Package');
 
     async function createPackage(req, res) {
       const { name, durationMonths, monthlyPrice } = req.body;
       const product = await stripe.products.create({ name });
       const price = await stripe.prices.create({
         product: product.id,
         unit_amount: monthlyPrice * 100, // in cents
         currency: 'usd',
         recurring: { interval: 'month', interval_count: 1 },
       });
       const newPackage = new Package({ name, durationMonths, monthlyPrice, stripeProductId: product.id, stripePriceId: price.id });
       await newPackage.save();
       res.json({ message: 'Package created' });
     }
     ```
 
2. **Subscribe Flow**:
   - User select package, backend Checkout Session banabe.
   - Frontend-e Stripe.js diye redirect.
 
3. **Webhook Handling**:
   - Endpoint setup: Use `express.raw({type: 'application/json'})` for body.
   - Example Code:
     ```javascript
     const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
     const UserSubscription = require('../models/UserSubscription');
     const Package = require('../models/Package');
 
     async function handleWebhook(req, res) {
       const sig = req.headers['stripe-signature'];
       let event;
       try {
         event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
       } catch (err) {
         return res.status(400).send(`Webhook Error: ${err.message}`);
       }
 
       if (event.type === 'checkout.session.completed') {
         const session = event.data.object;
         const subId = session.subscription;
         const packageId = session.metadata.packageId; // Pass metadata in checkout creation
         // Create UserSubscription with paymentCount=1
       } else if (event.type === 'invoice.payment_succeeded') {
         const invoice = event.data.object;
         const subId = invoice.subscription;
         const sub = await UserSubscription.findOne({ stripeSubscriptionId: subId });
         const pkg = await Package.findById(sub.packageId);
         sub.paymentCount += 1;
         await sub.save();
         if (sub.paymentCount >= pkg.durationMonths) {
           await stripe.subscriptions.cancel(subId);
           sub.status = 'canceled';
           await sub.save();
         }
       } else if (event.type === 'customer.subscription.canceled') {
         // Update DB
       }
 
       res.json({ received: true });
     }
     ```
   - Protibar payment hole DB update hobe, ar limit pure gele cancel.
 
Ei flow follow korle tomader system ready. Jodi Subscription Schedules use korte chao (Stripe diye auto handle), tahole webhook-e schedule attach korbe checkout complete hole – kintu eta optional. Kono question thakle bolo!
```