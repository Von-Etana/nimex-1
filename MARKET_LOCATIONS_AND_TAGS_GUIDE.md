# Market Locations & Product Tags Feature Guide

## Overview

This guide covers two major features added to the NIMEX platform:
1. **Market Location Registration** - Vendors can register their physical market locations
2. **Product Tags System** - Vendors can add tags (sub-categories) to products with intelligent suggestions

---

## 1. Market Location Registration

### What It Is
Vendors can now register the specific Nigerian market where their physical store is located (e.g., Balogun Market, Computer Village, Wuse Market). This helps customers:
- Find vendors by market location
- Discover nearby vendors in familiar markets
- Get specific shop locations within markets

### For Vendors

#### Setting Up Market Location

1. **Access Settings**
   - Navigate to `/vendor/settings` or click "Settings" in the vendor sidebar
   - Or from mobile menu → Profile → Vendor Dashboard → Settings

2. **Select Your Market**
   - Scroll to the "Market Location" section
   - Type in the search box to find your market
   - Markets are searchable by name, city, or state
   - Click on the market from the suggestions

3. **Add Specific Location Details**
   - Once a market is selected, add your specific location
   - Examples:
     - "Shop 45, Block B, Ground Floor"
     - "Stall 123, Section C"
     - "First Floor, Near Main Entrance"
   - This helps customers find your exact location within the market

4. **Save Changes**
   - Click "Save Changes" button
   - Your market location is now visible to customers

#### Pre-loaded Markets

The system comes with 20 popular Nigerian markets:

**Lagos Markets:**
- Balogun Market - Fashion, textiles, accessories
- Computer Village - Electronics, technology
- Tejuosho Market - Wholesale fashion
- Yaba Market - Clothing, shoes, bags
- Idumota Market - Cosmetics, toiletries
- Oshodi Market - Electronics, fashion, household
- Trade Fair Complex - Diverse products

**Abuja Markets:**
- Wuse Market - Fresh produce, fashion
- Garki Market - Fabrics, textiles
- Utako Market - Foods, groceries
- Kugbo Market - Furniture, home decor

**Other Major Markets:**
- Onitsha Main Market (Anambra) - Wholesale trade
- Ariaria International Market (Abia) - Leather goods
- Kurmi Market (Kano) - Textiles, grains
- Bodija Market (Ibadan) - Foodstuff, fashion
- And more...

### For Customers

#### Finding Vendors by Market

1. **Visit Vendors Page**
   - Go to `/vendors`
   - You'll see a "Filter by Market" button

2. **Filter by Market**
   - Click "Filter by Market"
   - Browse popular markets with vendor counts
   - Click on a market to filter vendors
   - Only vendors in that market will be displayed

3. **View Market Information**
   - Vendor profiles show their market location
   - Specific shop location is displayed (if provided)
   - You can chat with vendors for directions

### Database Schema

#### Markets Table
```sql
CREATE TABLE markets (
  id uuid PRIMARY KEY,
  name text UNIQUE NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  vendor_count integer DEFAULT 0,
  created_at timestamptz,
  updated_at timestamptz
);
```

#### Vendors Table Updates
```sql
ALTER TABLE vendors
  ADD COLUMN market_id uuid REFERENCES markets(id),
  ADD COLUMN market_location_details text;
```

---

## 2. Product Tags System

### What It Is
Product tags act as sub-categories that help with product discovery. When vendors add tags to their products:
- Tags are automatically suggested to other vendors in the same category
- Popular tags appear first in suggestions
- Customers can search and filter products by tags
- Improves SEO and product discoverability

### For Vendors

#### Adding Tags to Products

1. **Create/Edit Product**
   - When creating or editing a product, you'll see "Product Tags (Sub-categories)" section
   - Tags help customers find your product through search

2. **Use Auto-Suggestions**
   - Start typing a tag name (at least 2 characters)
   - System shows suggestions from other vendors in the same category
   - Suggestions are sorted by popularity (most-used tags first)
   - Each suggestion shows how many products use that tag

3. **Add New Tags**
   - Type your tag and press Enter or click "Add"
   - Tag is automatically created and saved
   - Other vendors in your category will see it as a suggestion
   - Tags are normalized (lowercase) but display with your casing

4. **Tag Limits**
   - Maximum 10 tags per product
   - Use specific, descriptive tags
   - Examples:
     - Instead of "shoes" → "women's sneakers", "leather boots", "running shoes"
     - Instead of "phone" → "samsung galaxy", "android smartphone", "5g phone"

5. **Remove Tags**
   - Click the X button on any tag to remove it
   - Removing a tag updates usage counts automatically

#### Tag Best Practices

**DO:**
- ✅ Use specific, descriptive tags
- ✅ Include brand names when relevant
- ✅ Use common search terms customers might use
- ✅ Check suggestions before creating new tags
- ✅ Use multiple relevant tags (up to 10)

**DON'T:**
- ❌ Use generic tags like "product" or "item"
- ❌ Duplicate information from category
- ❌ Use misleading tags
- ❌ Create multiple tags with similar meanings
- ❌ Use special characters or emojis

#### Example Tag Usage

**Fashion Category - Adire Fabric Product:**
- "adire fabric"
- "tie-dye"
- "nigerian textile"
- "indigo blue"
- "traditional fabric"
- "ankara alternative"

**Electronics Category - Smartphone Product:**
- "samsung galaxy"
- "android phone"
- "5g smartphone"
- "dual sim"
- "64gb storage"
- "48mp camera"

**Home & Office - Wooden Desk:**
- "office desk"
- "wooden furniture"
- "executive table"
- "home office"
- "work from home"
- "study desk"

### For Customers

#### Searching with Tags
- Use the search bar to find products
- Tags are included in search results
- Products with matching tags rank higher
- Filter results by popular tags

### Database Schema

#### Product Tags Table
```sql
CREATE TABLE product_tags (
  id uuid PRIMARY KEY,
  tag_name text NOT NULL,           -- Normalized lowercase
  display_name text NOT NULL,        -- Original casing
  category_id uuid REFERENCES categories(id),
  usage_count integer DEFAULT 0,     -- How many products use this
  created_by uuid REFERENCES profiles(id),
  is_approved boolean DEFAULT true,
  created_at timestamptz,
  UNIQUE(tag_name, category_id)
);
```

#### Product Tag Associations
```sql
CREATE TABLE product_tag_associations (
  id uuid PRIMARY KEY,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES product_tags(id) ON DELETE CASCADE,
  created_at timestamptz,
  UNIQUE(product_id, tag_id)
);
```

### Automatic Features

#### Tag Usage Counter
- Automatically increments when tag is added to a product
- Automatically decrements when tag is removed
- Used for sorting suggestions by popularity

#### Vendor Count Tracker
- Market vendor counts update automatically
- Triggers run when vendors add/remove/change markets
- Keeps market listings accurate

---

## Technical Implementation

### Components Created

1. **VendorProfileSettingsScreen** (`/src/screens/vendor/VendorProfileSettingsScreen.tsx`)
   - Complete vendor profile management
   - Market location search and selection
   - Business information updates
   - Specific shop location input

2. **ProductTagsInput** (`/src/components/vendor/ProductTagsInput.tsx`)
   - Reusable tag input component
   - Real-time suggestion loading
   - Auto-complete functionality
   - Usage count display
   - Tag creation and management

3. **VendorsScreen Updates** (`/src/screens/VendorsScreen.tsx`)
   - Market filter dropdown
   - Popular markets display
   - Vendor count per market
   - Filter state management

### Database Triggers

#### Update Tag Usage Count
```sql
CREATE TRIGGER trigger_update_tag_usage
  AFTER INSERT OR DELETE ON product_tag_associations
  FOR EACH ROW
  EXECUTE FUNCTION update_tag_usage_count();
```

#### Update Market Vendor Count
```sql
CREATE TRIGGER trigger_update_market_vendor_count
  AFTER INSERT OR UPDATE OR DELETE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_market_vendor_count();
```

### Routes Added

```typescript
// Vendor profile settings
GET/POST /vendor/settings

// Market filtering
GET /vendors?market={market_id}
```

### API Queries

#### Load Markets
```typescript
const { data } = await supabase
  .from('markets')
  .select('*')
  .eq('is_active', true)
  .order('vendor_count', { ascending: false });
```

#### Load Tag Suggestions
```typescript
const { data } = await supabase
  .from('product_tags')
  .select('*')
  .eq('category_id', categoryId)
  .eq('is_approved', true)
  .ilike('tag_name', `%${searchTerm}%`)
  .order('usage_count', { ascending: false })
  .limit(10);
```

#### Create New Tag
```typescript
const { data } = await supabase
  .from('product_tags')
  .insert({
    tag_name: normalizedName,
    display_name: originalName,
    category_id: categoryId,
    usage_count: 0,
    created_by: userId,
    is_approved: true,
  })
  .select()
  .single();
```

---

## Benefits

### For Vendors
1. ✅ **Better Discoverability** - Customers can find you by market location
2. ✅ **Increased Sales** - Better product tags mean better search results
3. ✅ **Easier Setup** - Auto-suggestions save time tagging products
4. ✅ **Customer Trust** - Physical market location builds credibility
5. ✅ **Competitive Advantage** - Stand out with specific location details

### For Customers
1. ✅ **Easy Navigation** - Find vendors in familiar markets
2. ✅ **Better Search** - Tags improve product search accuracy
3. ✅ **Physical Visits** - Get exact shop locations for in-person visits
4. ✅ **Market Browsing** - Explore all vendors in a specific market
5. ✅ **Trust** - Verified market locations build confidence

### For Platform
1. ✅ **Better SEO** - More searchable content
2. ✅ **Data Intelligence** - Popular tags and markets insights
3. ✅ **User Engagement** - Better filters increase browsing
4. ✅ **Vendor Quality** - Physical locations improve trust
5. ✅ **Scalability** - Tag system grows with vendor adoption

---

## Future Enhancements

### Planned Features
- [ ] Map integration showing vendor locations within markets
- [ ] Market verification badges
- [ ] Tag analytics dashboard for vendors
- [ ] Trending tags section
- [ ] Tag-based product recommendations
- [ ] Multi-market vendor support
- [ ] Market opening hours
- [ ] GPS coordinates for markets

---

## Support

### For Vendors
- Visit `/vendor/settings` to manage your profile
- Contact support if your market is not listed
- Review tag suggestions regularly to stay current

### For Administrators
- Review and approve new tags if needed
- Add new markets through database
- Monitor tag quality and remove spam
- Update market descriptions

---

**Last Updated:** October 23, 2025
**Version:** 1.0
**Status:** ✅ Production Ready
