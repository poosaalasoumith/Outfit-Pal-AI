import csv from "csvtojson";
import path from "path";

let cachedData = null;

function normalizeCategory(name) {
  if (!name) return null;
  const n = name.toLowerCase();

  if (n.match(/shirt|tshirt|jacket|hoodie|top/)) return "top";
  if (n.match(/jeans|pants|trouser|shorts|bottom/)) return "bottom";
  if (n.match(/shoe|sneaker|boot|loafer/)) return "shoes";

  return null;
}

function detectStyle(name) {
  const n = name ? name.toLowerCase() : "";

  if (n.match(/gym|sport|training|running/)) return "sports";
  if (n.match(/festival|ethnic|kurta|traditional/)) return "festival";
  if (n.match(/formal|blazer|office/)) return "formal";
  if (n.match(/party|night/)) return "party";

  return "casual";
}

function fixImage(item) {
  const img = item["Image File"];
  if (!img || img === "") {
    const query = item["Product Name"] ? encodeURIComponent(item["Product Name"]) : 'fashion';
    return `https://source.unsplash.com/600x800/?${query}`;
  }

  // If already URL
  if (img.startsWith("http")) return img;

  // If local file
  return `/images/${img}`;
}

export async function loadDataset() {
  if (cachedData) return cachedData;

  const filePath = path.join(process.cwd(), "fashion_dataset_reformatted.csv");

  const jsonArray = await csv().fromFile(filePath);

  cachedData = jsonArray.map(item => ({
    id: Number(item["Product ID"]),
    name: item["Product Name"],
    brand: item["Brand"],
    category: normalizeCategory(item["Category"]),
    color: (item["Color"] || "").toLowerCase(),
    price: Number(item["Price"]),
    rating: Number(item["Rating"]),
    image: fixImage(item),
    description: item["Description"],
    style: detectStyle(item["Product Name"])
  })).filter(p => p.category !== null);

  return cachedData;
}
