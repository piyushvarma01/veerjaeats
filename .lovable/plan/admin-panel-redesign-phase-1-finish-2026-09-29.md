# Admin Panel Redesign — Phase 1 (finish)

This is the same brief as before. The groundwork is already built: categories, multiple photos per product, and the extra product details. This phase builds the screens that use them.

## What you will get

1. **New layout**: a sidebar on the left with every section from your brief. On phones it becomes a menu button. Sections not built yet (Gallery, Website Images, Branding colours, Settings) show a "coming next" page.
2. **Dashboard**: summary cards for products, categories, reviews, reels, and orders, plus lists of recent reviews and recently added products.
3. **Products list**: a table with photo, name, category, price, stock, status, featured, and date added. It has search, filters for category, status, and stock, a sort option, and page numbers. Actions are View, Edit, Duplicate, and Delete. Delete asks you to confirm first. On phones the table turns into cards.
4. **Product editor** with these tabs:
   - Basic: name, SKU, category, descriptions
   - Pricing & Inventory: the pack sizes you already have, each with its own price, MRP, and stock
   - Images: see item 5
   - Product info: weight and tags
   - SEO: search engine title, description, and keywords
   - Publishing: Featured, Bestseller, and New flags
   
   Buttons: Save Draft, Publish, and Cancel.
5. **Photo manager**: upload several photos at once by dragging them in. You can drag photos to change their order, pick the main photo, replace or delete a photo, add a text description to each, and see a larger preview.
6. **Categories page**: add, edit, delete, and reorder categories. You can publish or hide each one and give it a photo, description, and search engine text.
7. **Product photos on your website**:
   - On computers: a large main photo with small thumbnails. Clicking a thumbnail changes the main photo, and you can zoom in.
   - On phones: swipe between photos, with dots showing which photo you're on, and a full-screen view.
   
   Products are grouped by category.
8. **Testing**: I'll add a product, upload photos, change the main photo, reorder the photos, edit the product, create a category, delete a test product, and check that the changes appear on your website.

## Later phases (not in this one)
Gallery, Website Images, full Branding with colours, extra Reels fields, Review extras (email, product, featured), and Settings.

## Technical details
- Split the large admin route into reusable components under `src/components/admin/`.
- Use the existing `admin.functions.ts` mutations. Add a public product-detail fetch with images to `storefront.functions.ts`.
- Build drag-and-drop with native HTML5 drag events plus touch-friendly up/down buttons, so no new dependency is needed.
- Upload photos through the existing storage and product-image flow.
