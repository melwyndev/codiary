import { createClient } from '@insforge/sdk';

export const insforge = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL || 'https://hxpct5r5.eu-central.insforge.app',
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || 'anon_22aa1ba06252dde17f0efd8bea0322d0ca8e6283d1c1f3610bad07f7c7319560',
});
