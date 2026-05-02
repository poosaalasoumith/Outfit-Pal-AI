const fs = require('fs');
const csv = require('csv-parser');

const INPUT_CSV = './outfit_pal_200_products_realistic.csv';
const OUTPUT_CSV = './outfit_pal_200_products_realistic.csv';

// reliable Unsplash images by category to make it look realistic
const categoryImages = {
  'Casual': [
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1434389670869-c49b42e7f918?w=600&h=800&fit=crop'
  ],
  'Streetwear': [
    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&h=800&fit=crop'
  ],
  'Party': [
    'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1566208535805-3e2832049d5c?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&h=800&fit=crop'
  ],
  'Formal': [
    'https://images.unsplash.com/photo-1585487000160-52e00ed64fee?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1594938298596-f308afed07be?w=600&h=800&fit=crop'
  ],
  'Sports': [
    'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1483721310020-03333e577078?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?w=600&h=800&fit=crop'
  ]
};

const defaultImages = [
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&h=800&fit=crop'
];

async function updateCsv() {
  const results = [];
  let header = [];
  
  // Read existing data
  await new Promise((resolve, reject) => {
    fs.createReadStream(INPUT_CSV)
      .pipe(csv())
      .on('headers', h => header = h)
      .on('data', (data) => {
        const cat = data['Category'];
        const images = categoryImages[cat] || defaultImages;
        // Deterministic pseudo-random based on string length to keep stable per row
        const index = (data['Product ID'].charCodeAt(1) + data['Product ID'].charCodeAt(3)) % images.length;
        
        data['Image File'] = images[index];
        results.push(data);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // Write back to CSV
  let csvContent = header.join(',') + '\n';
  results.forEach(row => {
    const rowArray = header.map(col => {
      let val = row[col];
      // Escape quotes for description
      if (val.includes(',') || val.includes('"')) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvContent += rowArray.join(',') + '\n';
  });

  fs.writeFileSync(OUTPUT_CSV, csvContent);
  console.log('CSV updated with stable Unsplash image URLs.');
}

updateCsv().catch(console.error);
