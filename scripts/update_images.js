require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');

async function updateDb() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Updating images to Supabase...');
  
  const updates = [];
  await new Promise((resolve) => {
    fs.createReadStream('./outfit_pal_200_products_realistic.csv')
      .pipe(csv())
      .on('data', (row) => {
        updates.push({
          id: row['Product ID'],
          image_file: row['Image File']
        });
      })
      .on('end', resolve);
  });

  let success = 0;
  for (let i = 0; i < updates.length; i++) {
    const { error } = await supabase
      .from('products')
      .update({ image_file: updates[i].image_file })
      .eq('id', updates[i].id);
    if (error) {
      console.error(`Error updating ${updates[i].id}:`, error);
    } else {
      success++;
    }
  }
  console.log(`Supabase updated successfully! ${success}/${updates.length} products updated.`);
}
updateDb().catch(console.error);
