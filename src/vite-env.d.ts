/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** OAuth Client ID (tipo "Web") do Google — o mesmo `GOOGLE_CLIENT_ID` do rust-api. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_FINANCE_MOCK?: string;
}
