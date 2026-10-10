# Customer accounts and reviews with photos and videos

## What customers will get
- A **Sign in / My account** button in the website header, with sign-up and sign-in by email and password or Google.
- A **My orders** page that lists every order they placed while signed in.
- On delivered orders, a **Write a review** button for each product: star rating, text, and up to 5 photos or 2 short videos.
- New reviews wait for your approval before anyone else can see them, the same as reviews do today.
- Approved reviews show on the product page with their photos and videos. Tapping one opens it larger.

## What you get in the admin panel
- The Reviews section shows each review's photos and videos, which product it is for, and a "Verified buyer" tag.
- You can approve or reject a review, delete one photo or video, or delete the whole review together with all of its files.

## Rules
- Only signed-in customers can review a product, and only from a delivered order that contains it.
- One review per product per order.
- Photos can be up to 10 MB each and are converted to WebP. Videos can be up to 50 MB each, in MP4 or WebM.
- Orders placed before this change aren't linked to an account, so they can't be reviewed.

## Technical details
- Database: add an optional `user_id` column to orders, filled in on the server from the signed-in session at checkout. Add optional `product_id`, `order_id` and `user_id` columns to reviews. Add a new `review_media` table with columns for the review, type (photo or video), file path and order.
- Security rules: customers can read their own orders, send reviews only for delivered orders that contain the product, and add media only to their own pending reviews. Admins have full access. Reviews and media in public view are filtered to approved reviews only.
- Storage: a new private `review-media` storage area. Files load through a public link that only serves media belonging to approved reviews, and to admins.
- New pages: a public `/account` page that prompts sign-in, and `/account/orders` behind the sign-in check. The product page fetches approved reviews for that product, with their media.
- Sign-in: the existing `/auth` page also handles customers. The header shows the account button based on whether the customer is signed in. The admin area stays limited to admins.
