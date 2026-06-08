import Stripe from "stripe";

// Singleton Stripe client — STRIPE_SECRET_KEY must be set in environment.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
