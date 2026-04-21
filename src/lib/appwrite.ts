import { Client, Account, Databases, Storage } from 'appwrite';

// Please ensure these variables are defined in your .env or .env.local file.
// Check README or the scripts/init-appwrite.js command to auto-generate them.
export const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';
export const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
export const DB_ID = import.meta.env.VITE_APPWRITE_DB_ID || '';
export const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID || '';

export const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
