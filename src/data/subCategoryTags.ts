export interface SubCategoryTag {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export const SUB_CATEGORY_TAGS: SubCategoryTag[] = [
  // Fashion & Clothing
  { id: 'traditional_wear', name: 'Traditional Wear', category: 'Fashion', description: 'Ankara, Aso Oke, etc.' },
  { id: 'modern_clothing', name: 'Modern Clothing', category: 'Fashion', description: 'Contemporary fashion' },
  { id: 'shoes', name: 'Shoes & Footwear', category: 'Fashion', description: 'Shoes, sandals, boots' },
  { id: 'accessories', name: 'Accessories', category: 'Fashion', description: 'Bags, jewelry, belts' },
  { id: 'headwear', name: 'Headwear', category: 'Fashion', description: 'Caps, hats, head ties' },

  // Electronics
  { id: 'phones', name: 'Mobile Phones', category: 'Electronics', description: 'Smartphones and accessories' },
  { id: 'computers', name: 'Computers', category: 'Electronics', description: 'Laptops, desktops, tablets' },
  { id: 'audio', name: 'Audio Equipment', category: 'Electronics', description: 'Speakers, headphones' },
  { id: 'gaming', name: 'Gaming', category: 'Electronics', description: 'Consoles, games, accessories' },
  { id: 'cameras', name: 'Cameras', category: 'Electronics', description: 'Digital cameras, photography' },

  // Food & Groceries
  { id: 'fresh_produce', name: 'Fresh Produce', category: 'Food', description: 'Fruits, vegetables, herbs' },
  { id: 'spices', name: 'Spices & Seasonings', category: 'Food', description: 'Local and imported spices' },
  { id: 'snacks', name: 'Snacks', category: 'Food', description: 'Chips, biscuits, nuts' },
  { id: 'beverages', name: 'Beverages', category: 'Food', description: 'Drinks, juices, soft drinks' },
  { id: 'oils', name: 'Oils & Condiments', category: 'Food', description: 'Palm oil, vegetable oil' },

  // Home & Garden
  { id: 'furniture', name: 'Furniture', category: 'Home & Garden', description: 'Chairs, tables, cabinets' },
  { id: 'decor', name: 'Home Decor', category: 'Home & Garden', description: 'Artwork, vases, cushions' },
  { id: 'kitchenware', name: 'Kitchenware', category: 'Home & Garden', description: 'Pots, pans, utensils' },
  { id: 'gardening', name: 'Gardening', category: 'Home & Garden', description: 'Plants, tools, supplies' },
  { id: 'bedding', name: 'Bedding', category: 'Home & Garden', description: 'Sheets, pillows, mattresses' },

  // Books & Education
  { id: 'textbooks', name: 'Textbooks', category: 'Books', description: 'Academic and educational books' },
  { id: 'novels', name: 'Novels', category: 'Books', description: 'Fiction and literature' },
  { id: 'children_books', name: 'Children\'s Books', category: 'Books', description: 'Books for kids' },
  { id: 'educational', name: 'Educational Materials', category: 'Books', description: 'Study guides, workbooks' },
  { id: 'stationery', name: 'Stationery', category: 'Books', description: 'Pens, notebooks, office supplies' },

  // Art & Crafts
  { id: 'paintings', name: 'Paintings', category: 'Art', description: 'Oil paintings, watercolors' },
  { id: 'sculptures', name: 'Sculptures', category: 'Art', description: 'Wood, metal, clay sculptures' },
  { id: 'handicrafts', name: 'Handicrafts', category: 'Art', description: 'Handmade crafts and items' },
  { id: 'textiles', name: 'Textiles', category: 'Art', description: 'Fabrics, tapestries, woven items' },
  { id: 'jewelry', name: 'Artisan Jewelry', category: 'Art', description: 'Handcrafted jewelry' },

  // Health & Beauty
  { id: 'skincare', name: 'Skincare', category: 'Health & Beauty', description: 'Creams, lotions, soaps' },
  { id: 'haircare', name: 'Hair Care', category: 'Health & Beauty', description: 'Shampoos, oils, treatments' },
  { id: 'makeup', name: 'Makeup', category: 'Health & Beauty', description: 'Cosmetics and beauty products' },
  { id: 'supplements', name: 'Supplements', category: 'Health & Beauty', description: 'Vitamins, herbs, health products' },
  { id: 'fragrances', name: 'Fragrances', category: 'Health & Beauty', description: 'Perfumes, colognes' },

  // Sports & Recreation
  { id: 'fitness', name: 'Fitness Equipment', category: 'Sports & Recreation', description: 'Gym equipment, weights' },
  { id: 'sports_wear', name: 'Sports Wear', category: 'Sports & Recreation', description: 'Athletic clothing' },
  { id: 'outdoor', name: 'Outdoor Gear', category: 'Sports & Recreation', description: 'Camping, hiking equipment' },
  { id: 'team_sports', name: 'Team Sports', category: 'Sports & Recreation', description: 'Football, basketball gear' },
  { id: 'water_sports', name: 'Water Sports', category: 'Sports & Recreation', description: 'Swimming, boating' },

  // Automotive
  { id: 'car_parts', name: 'Car Parts', category: 'Automotive', description: 'Engine parts, accessories' },
  { id: 'motorcycle', name: 'Motorcycle', category: 'Automotive', description: 'Motorcycle parts and accessories' },
  { id: 'tires', name: 'Tires & Wheels', category: 'Automotive', description: 'Tires, rims, wheels' },
  { id: 'car_electronics', name: 'Car Electronics', category: 'Automotive', description: 'Stereos, GPS, accessories' },
  { id: 'maintenance', name: 'Maintenance', category: 'Automotive', description: 'Oils, filters, tools' }
];

export const getSubCategoryTagsByCategory = (category: string): SubCategoryTag[] => {
  return SUB_CATEGORY_TAGS.filter(tag => tag.category === category);
};

export const searchSubCategoryTags = (query: string): SubCategoryTag[] => {
  const lowercaseQuery = query.toLowerCase();
  return SUB_CATEGORY_TAGS.filter(tag =>
    tag.name.toLowerCase().includes(lowercaseQuery) ||
    tag.category.toLowerCase().includes(lowercaseQuery) ||
    (tag.description && tag.description.toLowerCase().includes(lowercaseQuery))
  );
};

export const getSubCategoryTagById = (id: string): SubCategoryTag | undefined => {
  return SUB_CATEGORY_TAGS.find(tag => tag.id === id);
};