# Eva's Closet - E-commerce Platform

An e-commerce platform for selling clothes, built with Next.js, Prisma, SQLite, Stripe, and Nodemailer.

## Features

- Product listings with images and descriptions
- Shopping cart functionality
- Secure checkout with Stripe payment integration
- Order management with database storage
- Email notifications to the seller on new orders
- Responsive design with Tailwind CSS

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Prisma with SQLite
- **Payments:** Stripe (test mode)
- **Email:** Nodemailer with SMTP

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up the database:

```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL="file:./dev.db"

# Stripe test keys (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Domain for redirects
NEXT_PUBLIC_DOMAIN=http://localhost:3000

# Email configuration (use Ethereal for testing: https://ethereal.email/)
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=your-ethereal-user
EMAIL_PASS=your-ethereal-pass
```

### Setting up Stripe

1. Create a Stripe account at https://stripe.com
2. Get your test API keys from the dashboard
3. Set up a webhook endpoint for `checkout.session.completed` pointing to `/api/webhooks/stripe`
4. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

### Setting up Email

For testing, use Ethereal Email:
1. Go to https://ethereal.email/
2. Create an account and get SMTP credentials
3. Update the EMAIL_* variables in `.env`

For production, use Gmail or another SMTP provider.

### Running the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

- `app/` - Next.js app directory
  - `api/` - API routes
  - `products/` - Product listing page
  - `cart/` - Shopping cart page
  - `checkout/` - Checkout page
  - `success/` - Payment success page
- `components/` - React components
- `lib/` - Utility libraries
- `prisma/` - Database schema and seed files

## Database Schema

- **Product:** id, name, description, price, image, category
- **Order:** id, customerName, customerEmail, customerAddress, total, status, createdAt
- **OrderItem:** id, orderId, productId, quantity, price

## API Routes

- `GET /api/products` - Get all products
- `GET /api/products/[id]` - Get product by ID
- `POST /api/checkout` - Create Stripe checkout session
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

## Deployment

1. Build the application:

```bash
npm run build
```

2. Start the production server:

```bash
npm start
```

For deployment to Vercel or other platforms, ensure all environment variables are set.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.