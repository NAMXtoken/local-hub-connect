27/11 15:22 Switched business routing/data to slugs generated from business names.
27/11 17:24 Replaced dollar price icons with Thai baht characters in cards and detail page.
27/11 23:11 Added sitemap-powered option for extract_listing_text.py to crawl all listing URLs.
28/11 00:08 Added refine_listings.py to slice listing summaries into refined.txt segments.
28/11 11:04 Updated refine_listings.py to skip "Events" listings entirely.
28/11 11:50 Created export_listing_details.py to dump profile-left metadata for all listings.
28/11 14:16 Added join_listing_details.py to merge listing_details.csv with refined.txt descriptions.
28/11 14:50 Wired listings API + frontend to consume sitemap data via Vercel function and build script.
28/11 14:55 Hooked Directory filters/search to live listings data via FilterSidebar updates.
28/11 15:04 Restored original filter UI layout and added JSON fallback for local data fetches.
