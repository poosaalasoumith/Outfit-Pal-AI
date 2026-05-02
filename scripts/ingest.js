import { getSupabase } from '../lib/supabaseClient.js';
import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import path from 'node:path';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load .env.local first, then fallback to .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

// Safely map SUPABASE_URL if NEXT_PUBLIC_SUPABASE_URL doesn't exist yet
if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL;
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !geminiApiKey) {
  console.error("❌ Missing required environment variables.");
  process.exit(1);
}

const supabase = getSupabase();
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

const CSV_PATH = process.argv[2] || path.resolve(__dirname, '../outfit_pal_dataset.csv');

// Store errors for final summary
const errorLog = [];

async function generateEmbedding(text, imageBase64, mimeType = "image/jpeg", productId, productName) {
  try {
    let response;
    
    if (imageBase64) {
      response = await ai.models.embedContent({
        model: "gemini-embedding-2-preview",
        contents: {
          parts: [
            { text: text },
            {
              inlineData: {
                mimeType: mimeType,
                data: imageBase64
              }
            }
          ]
        },
        config: {
          outputDimensionality: 768
        }
      });
    } else {
      response = await ai.models.embedContent({
        model: "gemini-embedding-2-preview",
        contents: {
          parts: [
            { text: text }
          ]
        },
        config: {
          outputDimensionality: 768
        }
      });
    }

    
    // Ensure we safely extract the array of numbers
    if (response.embeddings && response.embeddings.length > 0) {
      return response.embeddings[0].values;
    }
    
    // Fallback if SDK structure varies slightly
    return response.values || response.embeddings;
  } catch (error) {
    const errorMsg = `Gemini Embedding Failed: ${error.message || error}`;
    console.error(`❌ [${productId}] ${errorMsg}`);
    errorLog.push({ productId, productName, error: errorMsg });
    return null;
  }
}

async function processRow(row) {
  const productId = row['Product ID']?.trim();
  const productName = row['Product Name']?.trim() || 'Unknown Product';
  
  if (!productId) {
    console.warn("⚠️ Skipping row missing 'Product ID'");
    return false;
  }

  console.log(`⏳ Processing Product: ${productName} (${productId})`);

  try {
    const combinedText = `
      Name: ${productName}
      Brand: ${row['Brand'] || ''}
      Category: ${row['Category'] || ''}
      Gender: ${row['Gender'] || ''}
      Color: ${row['Color'] || ''}
      Size Range: ${row['Size Range'] || ''}
      Price: ${row['Price'] || ''}
      Stock: ${row['Stock'] || ''}
      SKU: ${row['SKU'] || ''}
      Rating: ${row['Rating'] || ''}
      Description: ${row['Description'] || ''}
    `.trim();

    const imageFile = row['Image File']?.trim();
    let imageBase64 = null;
    let mimeType = "image/jpeg";
    
    // Fix image handling: Add try/catch specifically for image fetch
    if (imageFile && (imageFile.startsWith('http://') || imageFile.startsWith('https://'))) {
      try {
        const res = await fetch(imageFile);
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const buffer = await res.arrayBuffer();
        imageBase64 = Buffer.from(buffer).toString("base64");
        
        const contentType = res.headers.get('content-type');
        if (contentType) mimeType = contentType;
      } catch (err) {
        // If image fails, log it but CONTINUE without the image
        console.warn(`⚠️ [${productId}] Image fetch failed for ${imageFile}: ${err.message}. Proceeding with text-only embedding.`);
        imageBase64 = null; // Ensure fallback to text only
      }
    } else if (imageFile) {
      console.warn(`⚠️ [${productId}] Image is not a valid URL: ${imageFile}. Proceeding with text-only embedding.`);
    }

    // Generate multimodal embedding
    const embedding = await generateEmbedding(combinedText, imageBase64, mimeType, productId, productName);
    
    // Add fallback: If embedding fails -> skip row but log reason
    if (!embedding || !Array.isArray(embedding)) {
      if (!errorLog.find(e => e.productId === productId)) {
        errorLog.push({ productId, productName, error: "Embedding is null or invalid format" });
      }
      return false; // Skip this row
    }

    // Ensure Supabase insert works: Insert with embedding
    const { error: dbError } = await supabase.from('outfits').upsert({
      outfit_id: productId,
      outfit_name: productName,
      brand: row['Brand'],
      category: row['Category'],
      gender: row['Gender'],
      color: row['Color'],
      size_range: row['Size Range'],
      price: row['Price'] ? parseFloat(row['Price']) : null,
      rating: row['Rating'] ? parseFloat(row['Rating']) : null,
      description: row['Description'],
      image_file: imageFile, 
      links: row['Links'],
      embedding: embedding
    }, { onConflict: 'outfit_id' });

    if (dbError) {
      const errorMsg = `Supabase Insert Error: ${dbError.message}`;
      console.error(`❌ [${productId}] ${errorMsg}`);
      errorLog.push({ productId, productName, error: errorMsg });
      return false;
    }

    console.log(`✅ Successfully ingested: ${productId}`);
    return true;

  } catch (err) {
    // Top-level catch for unexpected errors in the row
    const errorMsg = `Unexpected Row Error: ${err.message}`;
    console.error(`❌ [${productId}] ${errorMsg}`);
    errorLog.push({ productId, productName, error: errorMsg });
    return false;
  }
}

async function main() {
  console.log(`\n=== Outfit Pal Ingestion Pipeline ===`);
  console.log(`📄 Using CSV Path: ${CSV_PATH}`);

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ ERROR: CSV file not found at ${CSV_PATH}`);
    process.exit(1);
  }

  const results = [];
  let successCount = 0;
  let failureCount = 0;
  
  fs.createReadStream(CSV_PATH)
    .pipe(csv())
    .on('data', (data) => {
      // Clean keys just in case CSV has leading/trailing whitespaces on columns
      const cleanData = {};
      for (const key in data) {
        cleanData[key.trim()] = data[key];
      }
      results.push(cleanData);
    })
    .on('end', async () => {
      console.log(`📊 Found ${results.length} rows in the CSV file.`);
      
      if (results.length > 0) {
        console.log(`\n🔍 First 2 rows for verification:`);
        console.log(JSON.stringify(results.slice(0, 2), null, 2));
      }

      console.log(`\n🚀 Starting ingestion process...`);
      for (const row of results) {
        if (!row['Product ID']) continue;

        const isSuccess = await processRow(row);
        if (isSuccess) successCount++;
        else failureCount++;
        
        // Small delay to avoid hitting Gemini rate limits
        await new Promise(res => setTimeout(res, 800));
      }

      console.log(`\n=========================================`);
      console.log(`🎉 Ingestion Pipeline Complete!`);
      console.log(`✅ Success: ${successCount} items inserted/updated`);
      console.log(`❌ Failed:  ${failureCount} items`);
      console.log(`=========================================\n`);

      // Add final summary: Print first 3 errors clearly
      if (errorLog.length > 0) {
        console.log(`⚠️ Summary of first ${Math.min(3, errorLog.length)} errors encountered:`);
        errorLog.slice(0, 3).forEach((errItem, idx) => {
          console.log(`  ${idx + 1}. Product: ${errItem.productName} (${errItem.productId}) -> ${errItem.error}`);
        });

        if (errorLog.length > 3) {
          console.log(`  ...and ${errorLog.length - 3} more errors.`);
        }
      }
    })
    .on('error', (err) => {
      console.error(`❌ Error reading CSV file:`, err.message);
    });
}

main();
