import { databases, DB_ID } from "./appwrite";

const collections: Record<string, string> = {
  customers: import.meta.env.VITE_APPWRITE_CUSTOMERS_COLLECTION || "customers",
  suppliers: import.meta.env.VITE_APPWRITE_SUPPLIERS_COLLECTION || "suppliers",
  items: import.meta.env.VITE_APPWRITE_ITEMS_COLLECTION || "items",
  transactions: import.meta.env.VITE_APPWRITE_TRANSACTIONS_COLLECTION || "transactions",
};

/**
 * Robustly synchronizes a local Dexie record to Appwrite Cloud.
 * Uses an "Upsert" pattern (tries to Update, falls back to Create).
 */
export const syncToCloud = async (tableName: string, dexieId: number, data: any) => {
  const collectionId = collections[tableName];
  if (!collectionId || !DB_ID) return;

  const docId = dexieId.toString();
  const payload = { ...data };
  
  // Appwrite schema doesn't want the auto-increment ID in the document body
  delete payload.id;
  
  // Ensure related_id handles type strictness for Appwrite (requires string)
  if (payload.related_id !== undefined && payload.related_id !== null) {
      payload.related_id = payload.related_id.toString();
  }
  
  // Strip null or undefined fields if Appwrite Schema doesn't want them
  // Dexie might have them stored, Appwrite handles undefined better if removed completely
  Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
          delete payload[key];
      }
  });

  try {
    // 1. Try to update an existing document
    await databases.updateDocument(DB_ID, collectionId, docId, payload);
  } catch (error: any) {
    if (error?.code === 404) {
      // 2. If it does not exist (404), create it
      try {
        await databases.createDocument(DB_ID, collectionId, docId, payload);
      } catch (err) {
        console.warn(`[Sync] Failed to create in ${tableName} ${docId}:`, err);
      }
    } else {
      console.warn(`[Sync] Failed to update in ${tableName} ${docId}:`, error);
    }
  }
};

/**
 * Simply deletes the document from Appwrite when deleted from Dexie.
 */
export const deleteFromCloud = async (tableName: string, dexieId: number) => {
  const collectionId = collections[tableName];
  if (!collectionId || !DB_ID) return;

  try {
    await databases.deleteDocument(DB_ID, collectionId, dexieId.toString());
  } catch (error: any) {
    if (error?.code !== 404) { // Ignore 404s, it's already deleted
      console.warn(`[Sync] Failed to delete in ${tableName} ${dexieId}:`, error);
    }
  }
};
