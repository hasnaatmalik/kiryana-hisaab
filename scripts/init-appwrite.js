import { Client, Databases, Storage, ID, Permission, Role } from 'node-appwrite';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log("\n🚀 Welcome to Kiryana Hisaab Appwrite Initializer!\n");
  console.log("Please make sure you have created an account at https://cloud.appwrite.io");
  console.log("and have created a new Project and generated an API Key.\n");

  const endpoint = await question("Enter Appwrite Endpoint (default: https://cloud.appwrite.io/v1): ") || "https://cloud.appwrite.io/v1";
  const projectId = await question("Enter Project ID: ");
  const apiKey = await question("Enter API Key (needs Database and Storage scopes): ");

  if (!projectId || !apiKey) {
    console.error("❌ Project ID and API Key are required!");
    process.exit(1);
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const databases = new Databases(client);
  const storage = new Storage(client);

  try {
    let dbId;
    try {
      console.log("\n📦 Setting up Database...");
      const db = await databases.create(ID.unique(), 'KiryanaHisaab');
      dbId = db.$id;
      console.log(`✅ Database created with ID: ${dbId}`);
    } catch (dbErr) {
      if (dbErr.code === 403 || dbErr.code === 409) {
        console.log("ℹ️ Database limit reached, attempting to use existing database...");
        const existingDbs = await databases.list();
        if (existingDbs.databases.length > 0) {
          dbId = existingDbs.databases[0].$id;
          console.log(`✅ Successfully found existing Database with ID: ${dbId}`);
        } else {
          throw dbErr;
        }
      } else {
        throw dbErr;
      }
    }

    console.log("🛠️ Creating 'customers' collection...");
    const customersId = 'customers';
    await databases.createCollection(dbId, customersId, 'Customers', [Permission.read(Role.any()), Permission.write(Role.any())]);
    await databases.createStringAttribute(dbId, customersId, 'name', 255, true);
    await databases.createStringAttribute(dbId, customersId, 'phone', 50, false);
    await databases.createFloatAttribute(dbId, customersId, 'balance', false, 0);
    await databases.createIntegerAttribute(dbId, customersId, 'default_due_days', false, 30);
    await databases.createStringAttribute(dbId, customersId, 'risk_status', 50, false, 'good');

    console.log("🛠️ Creating 'suppliers' collection...");
    const suppliersId = 'suppliers';
    await databases.createCollection(dbId, suppliersId, 'Suppliers', [Permission.read(Role.any()), Permission.write(Role.any())]);
    await databases.createStringAttribute(dbId, suppliersId, 'name', 255, true);
    await databases.createFloatAttribute(dbId, suppliersId, 'payable_balance', false, 0);

    console.log("🛠️ Creating 'items' collection...");
    const itemsId = 'items';
    await databases.createCollection(dbId, itemsId, 'Items', [Permission.read(Role.any()), Permission.write(Role.any())]);
    await databases.createStringAttribute(dbId, itemsId, 'name', 255, true);
    await databases.createFloatAttribute(dbId, itemsId, 'price', true);
    await databases.createStringAttribute(dbId, itemsId, 'emoji', 50, false);
    await databases.createStringAttribute(dbId, itemsId, 'category', 100, false);
    await databases.createStringAttribute(dbId, itemsId, 'description', 2000, false);
    await databases.createStringAttribute(dbId, itemsId, 'image_url', 2000, false);

    console.log("🛠️ Creating 'transactions' collection...");
    const transactionsId = 'transactions';
    await databases.createCollection(dbId, transactionsId, 'Transactions', [Permission.read(Role.any()), Permission.write(Role.any())]);
    await databases.createStringAttribute(dbId, transactionsId, 'type', 100, true);
    await databases.createFloatAttribute(dbId, transactionsId, 'amount', true);
    await databases.createStringAttribute(dbId, transactionsId, 'related_id', 100, false);
    await databases.createStringAttribute(dbId, transactionsId, 'date', 100, true);
    await databases.createStringAttribute(dbId, transactionsId, 'description', 1000, false);

    console.log("📂 Setting up Storage Bucket for Images...");
    const bucket = await storage.createBucket(ID.unique(), 'ItemImages', [Permission.read(Role.any()), Permission.write(Role.any())], false, false, undefined, ['jpg', 'png', 'jpeg', 'webp']);
    const bucketId = bucket.$id;
    console.log(`✅ Bucket created with ID: ${bucketId}`);

    console.log("\n📝 Writing to .env.local file...");
    const envContent = `VITE_APPWRITE_ENDPOINT=${endpoint}
VITE_APPWRITE_PROJECT_ID=${projectId}
VITE_APPWRITE_DB_ID=${dbId}
VITE_APPWRITE_BUCKET_ID=${bucketId}
VITE_APPWRITE_CUSTOMERS_COLLECTION=${customersId}
VITE_APPWRITE_SUPPLIERS_COLLECTION=${suppliersId}
VITE_APPWRITE_ITEMS_COLLECTION=${itemsId}
VITE_APPWRITE_TRANSACTIONS_COLLECTION=${transactionsId}
`;

    fs.writeFileSync(path.resolve(process.cwd(), '.env.local'), envContent);
    console.log("✅ Credentials successfully written to .env.local!");

    console.log("\n🎉 ALL DONE! Your Appwrite database is fully configured.");
    console.log("You can now start using Kiryana Hisaab backed by Appwrite.");

  } catch (err) {
    console.error("❌ Error setting up Appwrite:", err);
  } finally {
    rl.close();
  }
}

main();
