/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly DEV: boolean;
    readonly PROD: boolean;
    readonly MODE: string;
    readonly BASE_URL: string;
    readonly VITE_API_URL?: string;
    readonly VITE_WS_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
