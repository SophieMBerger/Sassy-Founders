/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CARBON_ADS_SERVE?: string;
  readonly VITE_CARBON_ADS_PLACEMENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
