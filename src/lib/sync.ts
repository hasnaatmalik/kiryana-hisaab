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

/**
 * Downloads all data from Appwrite and updates the local IndexedDB.
 * This runs when the app boots up so all devices receive the latest data.
 */
export const pullAllFromCloud = async () => {
  if (!DB_ID) return;

  try {
    const { db } = await import('@/db');
    
    await db.transaction("rw", db.items, db.customers, db.suppliers, db.transactions, async () => {
      
      // --- 1. SYNC ITEMS ---
      if (collections.items) {
        const itemRes = await databases.listDocuments(DB_ID, collections.items, []);
        if (itemRes.documents) {
          const docs = [...itemRes.documents].sort((a, b) => {
             if (a.image_url && !b.image_url) return -1;
             if (!a.image_url && b.image_url) return 1;
             return parseInt(b.$id) - parseInt(a.$id);
          });
          const seenNames = new Set<string>();
          for (const doc of docs) {
            const id = parseInt(doc.$id);
            if (isNaN(id)) continue;
            const normalizedName = doc.name.trim().toLowerCase();

            if (seenNames.has(normalizedName)) {
               await db.items.delete(id).catch(() => {});
               databases.deleteDocument(DB_ID, collections.items, doc.$id).catch(() => {});
               continue;
            }
            seenNames.add(normalizedName);

            const dupes = await db.items.filter(it => it.name.trim().toLowerCase() === normalizedName && it.id !== id).toArray();
            for (const dup of dupes) await db.items.delete(dup.id!).catch(() => {});

            const localObj = await db.items.get(id);
            if (localObj) {
              const updates: any = {};
              let changed = false;
              if (doc.image_url !== localObj.image_url) { updates.image_url = doc.image_url; changed = true; }
              if (doc.price !== localObj.price) { updates.price = doc.price; changed = true; }
              if (doc.name !== localObj.name) { updates.name = doc.name; changed = true; }
              if (doc.description !== localObj.description) { updates.description = doc.description; changed = true; }
              if (changed) await db.items.update(id, updates);
            } else {
              await db.items.add({
                id, name: doc.name, price: doc.price, emoji: doc.emoji || "📦",
                category: doc.category || "grocery", description: doc.description, image_url: doc.image_url
              });
            }
          }
        }
      }

      // --- 2. SYNC CUSTOMERS ---
      if (collections.customers) {
        const custRes = await databases.listDocuments(DB_ID, collections.customers, []);
        if (custRes.documents) {
          const docs = [...custRes.documents].sort((a, b) => parseInt(b.$id) - parseInt(a.$id));
          const seenPhones = new Set<string>();
          for (const doc of docs) {
            const id = parseInt(doc.$id);
            if (isNaN(id)) continue;
            const phone = doc.phone.trim();

            if (seenPhones.has(phone)) {
               await db.customers.delete(id).catch(() => {});
               databases.deleteDocument(DB_ID, collections.customers, doc.$id).catch(() => {});
               continue;
            }
            seenPhones.add(phone);

            const dupes = await db.customers.filter(c => c.phone.trim() === phone && c.id !== id).toArray();
            for (const dup of dupes) await db.customers.delete(dup.id!).catch(() => {});

            const localObj = await db.customers.get(id);
            if (localObj) {
              const updates: any = {};
              let changed = false;
              if (doc.name !== localObj.name) { updates.name = doc.name; changed = true; }
              if (doc.balance !== localObj.balance) { updates.balance = doc.balance; changed = true; }
              if (doc.default_due_days !== localObj.default_due_days) { updates.default_due_days = doc.default_due_days; changed = true; }
              if (doc.risk_status !== localObj.risk_status) { updates.risk_status = doc.risk_status; changed = true; }
              if (changed) await db.customers.update(id, updates);
            } else {
              await db.customers.add({
                id, name: doc.name, phone: doc.phone, balance: doc.balance,
                default_due_days: doc.default_due_days, risk_status: doc.risk_status
              });
            }
          }
        }
      }

      // --- 3. SYNC SUPPLIERS ---
      if (collections.suppliers) {
        const supRes = await databases.listDocuments(DB_ID, collections.suppliers, []);
        if (supRes.documents) {
          const docs = [...supRes.documents].sort((a, b) => parseInt(b.$id) - parseInt(a.$id));
          const seenNames = new Set<string>();
          for (const doc of docs) {
            const id = parseInt(doc.$id);
            if (isNaN(id)) continue;
            const name = doc.name.trim().toLowerCase();

            if (seenNames.has(name)) {
               await db.suppliers.delete(id).catch(() => {});
               databases.deleteDocument(DB_ID, collections.suppliers, doc.$id).catch(() => {});
               continue;
            }
            seenNames.add(name);

            const dupes = await db.suppliers.filter(s => s.name.trim().toLowerCase() === name && s.id !== id).toArray();
            for (const dup of dupes) await db.suppliers.delete(dup.id!).catch(() => {});

            const localObj = await db.suppliers.get(id);
            if (localObj) {
              const updates: any = {};
              let changed = false;
              if (doc.payable_balance !== localObj.payable_balance) { updates.payable_balance = doc.payable_balance; changed = true; }
              if (changed) await db.suppliers.update(id, updates);
            } else {
              await db.suppliers.add({ id, name: doc.name, payable_balance: doc.payable_balance });
            }
          }
        }
      }

      // --- 4. SYNC TRANSACTIONS ---
      if (collections.transactions) {
        const txRes = await databases.listDocuments(DB_ID, collections.transactions, []);
        if (txRes.documents) {
          const docs = [...txRes.documents];
          const seenHashes = new Set<string>();
          for (const doc of docs) {
            const id = parseInt(doc.$id);
            if (isNaN(id)) continue;
            
            // Hash = date + amount + description (to identify unique transactions)
            const hash = `${doc.date}_${doc.amount}_${doc.description.trim()}`.toLowerCase();

            if (seenHashes.has(hash)) {
               await db.transactions.delete(id).catch(() => {});
               databases.deleteDocument(DB_ID, collections.transactions, doc.$id).catch(() => {});
               continue;
            }
            seenHashes.add(hash);

            const dupes = await db.transactions.filter(t => 
              `${t.date}_${t.amount}_${t.description.trim()}`.toLowerCase() === hash && t.id !== id
            ).toArray();
            for (const dup of dupes) await db.transactions.delete(dup.id!).catch(() => {});

            const localObj = await db.transactions.get(id);
            if (localObj) {
               // Update it if it exists (mostly amounts or descriptions could change theoretically)
               const updates: any = {};
               let changed = false;
               if (doc.amount !== localObj.amount) { updates.amount = doc.amount; changed = true; }
               if (doc.description !== localObj.description) { updates.description = doc.description; changed = true; }
               if (doc.type !== localObj.type) { updates.type = doc.type; changed = true; }
               if (changed) await db.transactions.update(id, updates);
            } else {
               await db.transactions.add({
                 id, type: doc.type, amount: doc.amount,
                 related_id: doc.related_id ? parseInt(doc.related_id) : undefined,
                 date: doc.date, description: doc.description
               });
            }
          }
        }
      }

    });
    console.log("[Sync] ALL Data pulled and deduplicated successfully!");
  } catch (error) {
    console.warn("[Sync] Failed to pull all data from cloud:", error);
  }
};
