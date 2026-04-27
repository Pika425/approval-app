import {
  PublicClientApplication,
  type AccountInfo,
  type Configuration,
  BrowserCacheLocation,
} from "@azure/msal-browser";

const clientId = (import.meta.env.VITE_AAD_CLIENT_ID as string) || "";
const tenantId = (import.meta.env.VITE_AAD_TENANT_ID as string) || "";
const redirectUri = (import.meta.env.VITE_AAD_REDIRECT_URI as string) || window.location.origin;

export const isAadConfigured = Boolean(clientId && tenantId);

const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
  },
  cache: {
    cacheLocation: BrowserCacheLocation.LocalStorage,
  },
};

let instance: PublicClientApplication | null = null;

export function getMsalInstance(): PublicClientApplication {
  if (!instance) {
    instance = new PublicClientApplication(msalConfig);
  }
  return instance;
}

export const loginRequest = {
  scopes: ["openid", "profile", "email", "User.Read"],
};

export type AuthUser = {
  displayName: string;
  email: string;
};

export function accountToUser(account: AccountInfo): AuthUser {
  return {
    displayName: account.name || account.username || "",
    email: account.username || "",
  };
}
