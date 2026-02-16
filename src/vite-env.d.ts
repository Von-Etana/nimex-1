/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  readonly VITE_TWILIO_ACCOUNT_SID: string;
  readonly VITE_TWILIO_AUTH_TOKEN: string;
  readonly VITE_TWILIO_API_KEY: string;
  readonly VITE_TWILIO_API_SECRET: string;
  readonly VITE_TWILIO_PHONE_NUMBER: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_PAYSTACK_PUBLIC_KEY: string;
  readonly VITE_PAYSTACK_TEST_MODE: string;
  readonly VITE_GIGL_API_URL: string;
  readonly VITE_GIGL_API_KEY: string;
  readonly VITE_GIGL_TEST_MODE: string;
  readonly VITE_FLUTTERWAVE_API_KEY: string;
  readonly VITE_FLUTTERWAVE_API_URL: string;
  readonly VITE_FLUTTERWAVE_TEST_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    google: typeof google;
  }
}