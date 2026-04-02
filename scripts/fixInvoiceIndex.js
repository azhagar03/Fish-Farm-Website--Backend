// scripts/fixInvoiceIndex.js
// Run once: node scripts/fixInvoiceIndex.js
// This drops the old global unique index on invoiceNo and creates
// a compound unique index (invoiceNo + accountingYearId) instead.

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI 

async function fixIndex() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected ✓');

  const db = mongoose.connection.db;
  const collection = db.collection('invoices');

  // 1. List existing indexes
  const indexes = await collection.indexes();
  console.log('\nExisting indexes:');
  indexes.forEach(idx => console.log(' -', idx.name, JSON.stringify(idx.key)));

  // 2. Drop the old single-field unique index on invoiceNo (if it exists)
  const oldIndexNames = ['invoiceNo_1', 'invoiceNo_1_unique'];
  for (const name of oldIndexNames) {
    const exists = indexes.find(i => i.name === name);
    if (exists) {
      try {
        await collection.dropIndex(name);
        console.log(`\n✓ Dropped old index: ${name}`);
      } catch (e) {
        console.log(`  Could not drop ${name}:`, e.message);
      }
    }
  }

  // 3. Drop any unique index on invoiceNo alone (detect by key shape)
  for (const idx of indexes) {
    const keys = Object.keys(idx.key);
    if (keys.length === 1 && keys[0] === 'invoiceNo' && idx.unique) {
      try {
        await collection.dropIndex(idx.name);
        console.log(`✓ Dropped old unique index: ${idx.name}`);
      } catch (e) {
        console.log(`  Could not drop ${idx.name}:`, e.message);
      }
    }
  }

  // 4. Create new compound unique index
  try {
    await collection.createIndex(
      { invoiceNo: 1, accountingYearId: 1 },
      { unique: true, name: 'invoiceNo_per_year' }
    );
    console.log('✓ Created compound unique index: invoiceNo_per_year');
  } catch (e) {
    if (e.code === 85 || e.message.includes('already exists')) {
      console.log('  Compound index already exists — skipping');
    } else {
      console.error('  Error creating index:', e.message);
    }
  }

  // 5. Verify
  const newIndexes = await collection.indexes();
  console.log('\nFinal indexes:');
  newIndexes.forEach(idx => console.log(' -', idx.name, JSON.stringify(idx.key), idx.unique ? '(unique)' : ''));

  await mongoose.disconnect();
  console.log('\nDone ✓ You can now create invoices across multiple years.');
}

fixIndex().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});