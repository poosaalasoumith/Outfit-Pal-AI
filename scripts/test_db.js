import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  console.log("Checking DB Connection...");
  const { data, error, count } = await supabase.from('outfits').select('id', { count: 'exact' });
  if (error) {
    console.error("DB Check Failed:", error);
    process.exit(1);
  }
  console.log(`Total outfits: ${count}`);

  const { data: embedData, error: embedError } = await supabase.from('outfits').select('id, outfit_name').not('embedding', 'is', null).limit(100);
  if (embedError) {
    console.error("Embedding Check Failed:", embedError);
    process.exit(1);
  }
  
  console.log(`Outfits WITH embeddings (limit 100): ${embedData.length}`);
}

checkDb();
