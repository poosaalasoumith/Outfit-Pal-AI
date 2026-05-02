# 👗 Outfit Pal AI

AI-powered fashion recommendation web application that generates smart outfit suggestions based on user queries and images.

---

## 🚀 Overview

Outfit Pal AI is a full-stack web app that helps users find the perfect outfit using:

- 🧠 Text input (e.g., "gym outfit", "festival wear")
- 🖼️ Image input (upload outfit inspiration)
- 📊 Fashion dataset (100+ products)

It uses a hybrid system:
- Dataset-based recommendations
- Rule-based styling engine
- Online fallback (Unsplash images)

---

## ✨ Features

### 👕 Smart Outfit Generation
- Generates complete outfits:
  - Top
  - Bottom
  - Shoes
- Ensures:
  - Correct categories
  - Style matching
  - Color balance

---

### 🎯 Intent-Based Recommendations
- Gym → Sportswear
- Festival → Ethnic outfits
- Formal → Office wear
- Casual → Everyday outfits

---

### 🎨 Diversity Engine
- Always generates 3 unique outfit options
- Prevents repetition
- Ensures variety in colors and styles

---

### 🖼️ Image-Based Matching
- Upload an image
- Extract dominant colors
- Suggest similar outfits

---

### ❤️ User Interaction
- Swipe UI (Tinder-like)
- Like ❤️
- Reject ❌
- Save 💾 outfits
- Wishlist + History pages

---

### 🔐 Authentication & Storage
- Supabase integration
- Saved outfits (Wishlist)
- User history tracking

---

## 🏗️ Tech Stack

Frontend:
- Next.js
- React
- Tailwind CSS

Backend:
- Next.js API Routes
- Node.js

Database:
- Supabase

Image Processing:
- Sharp

Dataset:
- Kaggle fashion dataset (custom cleaned)

---

## 📂 Project Structure

app/
components/
lib/
public/
scripts/
supabase/

fashion_dataset_reformatted.csv
package.json
tailwind.config.js

---

## ⚙️ Installation

1. Clone the repository

git clone https://github.com/poosaalasoumith/Outfit-Pal-AI 
cd outfit-pal-ai

---

2. Install dependencies

npm install

---

3. Add environment variables

Create a file:

.env.local

Add:

NEXT_PUBLIC_SUPABASE_URL=your_url  
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key  

---

4. Run the app

npm run dev

Open in browser:

http://localhost:3000

---

## 🧠 How It Works

1. User enters query or uploads image  
2. System detects intent (gym, festival, etc.)  
3. Filters dataset by style + category  
4. Splits into top / bottom / shoes  
5. Generates 3 unique outfits  
6. Applies fallback if data is missing  

---

## ⚠️ Limitations

- Depends on dataset quality  
- Rule-based (not deep AI yet)  
- Limited fashion coverage  

---

## 🔮 Future Improvements

- AI model integration (CLIP / embeddings)  
- Personalized recommendations  
- Accessories suggestions  
- Trend-based styling  

---

## 👨‍💻 Author

Poosaala Soumith  
B.Tech CSE  

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
