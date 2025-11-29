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
28/11 15:22 Added image download/build scripts and local image preference for listings.
28/11 16:04 Implemented API/query-driven filtering with server- and client-side fallbacks for listings.
28/11 16:13 JSON build now rewrites listing images to local /listing-images paths after downloads.
28/11 16:22 Extended export script + JSON to capture Google Maps embed coordinates for each listing.
28/11 16:31 Added Mapbox-powered DirectoryMap component with filtered pins and env-driven token.
28/11 18:29 Rebuilt directory UI into TripAdvisor-style layout with sidebar list + full-height map.
28/11 18:39 Added layout preference context + header toggle to swap between classic and explorer directory UIs.
28/11 20:30 Applied home category query params so Directory loads with matching filters.
28/11 20:48 Replaced home category grid with 8 tag-backed catch-all filters (Food & Beverage, Accommodation, etc.).
28/11 20:59 Updated directory business cards to use slug-based keys to avoid React warnings.
28/11 21:05 Ensured Directory list/grid keys combine slug + id to avoid duplicate React warnings.
28/11 21:08 Made Directory card keys index-aware to avoid duplicate slug/id combos triggering warnings.
28/11 22:27 Rebuilt explorer filters into search row + category/location dropdown row with Search action.
28/11 22:29 Guarded explorer dropdown values until options load so category deep-links don’t crash.
28/11 22:31 Replaced Radix selects with native dropdowns to resolve invalid hook call errors.
28/11 22:32 Removed explorer sidebar header and show/hide toggle so filter form is now the top section.
28/11 22:37 Moved explorer filter form into a floating map overlay and removed sidebar version.
28/11 22:39 Restyled floating map filters into a single-row full-width layout.
28/11 22:40 Repositioned explorer "Viewing" counter card to bottom-right of the map overlay.
28/11 22:42 Moved Mapbox navigation controls to bottom-right as requested.
28/11 22:44 Tightened padding on floating explorer filters (inputs, dropdowns, button) for slimmer row.
28/11 22:45 Slimmed floating filter controls further (shorter height, tighter horizontal padding).
28/11 22:48 Added extra right padding on explorer dropdowns so arrow icons have breathing room.
28/11 22:49 Wrapped explorer dropdowns with custom icons + appearance-none selects for proper right padding.
28/11 23:05 Added persistent bump API, daily limits, anon IDs, and live leaderboard tied to new metrics.
28/11 23:09 Restored per-category leaderboard UI while feeding it with live bump metrics.
28/11 23:11 Improved bump hook/button logic so stats load without userID and button only disables during cooldown.
28/11 23:13 Made anon IDs immediate and stop disabling bump button unless cooldown info exists.
28/11 23:14 Added JSON-safe bump mutation handling and request parsing to fix API errors.
28/11 23:16 Added localStorage fallback for bumps API so dev mode works when /api/bumps is unavailable.
28/11 23:19 Synced local bump stats/leaderboard updates and added playful cooldown messaging.
28/11 23:28 Reverted hero/leaderboard layout so sections match original ordering.
28/11 23:32 Pointed server bump storage to /tmp on Vercel (or env override) so API writes succeed.
28/11 23:35 Forced bumps/listings API routes onto nodejs runtime so fs writes work on Vercel.
28/11 23:37 Corrected Vercel runtime config to "nodejs" (supported value) for bumps/listings APIs.
29/11 10:39 Moved listings loader into lib/server and updated API imports to fix missing module in prod.
29/11 10:47 Resolved all lint errors by tightening bump types, Map deps, Tailwind import, and suppressing shared shadcn helper warnings.
29/11 11:04 Defaulted directory filters to Food & Beverage, removed All Categories option, and renamed All Locations to Island Wide.
29/11 11:08 Aligned default directory category with existing 'Food & Beverage' option to avoid duplicate filters.
29/11 11:10 Moved explorer overlay into fixed map container so filters stay pinned when scrolling.
29/11 11:14 Sorted directory listings by bump leaderboard counts so highest-engagement businesses show first.
29/11 11:18 Allowed directory to fetch extended bump leaderboard (limit 500) so Food & Beverage stays ordered by live counts.
29/11 11:20 Removed homepage Featured Businesses filler section now that live leaderboard handles discovery.
29/11 11:22 Restored homepage featured section and removed Top Loved placeholder data so leaderboard only shows live bumps.
29/11 11:25 Leaderboard hook now falls back to production API origin so home/dir views show live bump data even when local functions are empty.
29/11 11:28 Reverted leaderboard hook to local API + fallback only so existing bump flows behave like before while keeping placeholders removed.
29/11 11:34 Rebuilt homepage leaderboard to always show 8 key categories with bump-sorted results and alphabetical fallbacks per category.
29/11 11:39 Category grid counts now reflect actual listing totals per featured category (with dynamic data fallback).
29/11 12:58 Directory map now requests browser geolocation and drops a marker (with fallback message) to show the user’s current position.
29/11 13:24 Swapped business contact info for clickable buttons (tel/mail/WhatsApp/Line links).
29/11 13:42 Added Instagram Basic Display serverless API with token storage and setup docs.
29/11 13:47 Added CLI helper to run the Instagram OAuth flow locally and store tokens.
29/11 15:56 Added Claim Profile flow with form & IG post fields plus CTA on business pages and routing.
29/11 16:07 Claim submissions now persist via /api/claims and override listings immediately (stored in data/listing-claims.json).
29/11 16:29 Added shared claim parser + Vite dev middleware so /api/claims works locally and data writes persist to listing-claims.json.
29/11 16:54 Client-side listing fallback now merges claim overrides (incl. IG posts) so changes appear immediately even in dev mode.
29/11 16:56 Business pages now render claimed Instagram posts via iframe grid (fallback link if embed fails).
29/11 16:59 Refined Instagram embed iframes to be borderless, fixed-height, and scrolling-free for cleaner tiles.
29/11 17:10 Added new-business flow (Add Business button, /business/new route, API + storage) reusing claim form + custom listings merge.
29/11 17:32 Add business/claim form now uses dropdowns for category/location with predefined options for consistency.
29/11 17:34 Removed dormant Categories nav link from header so only live routes remain.
29/11 17:35 Header only shows Classic/Explorer toggle while browsing /directory (desktop + mobile).
29/11 17:46 Ensured serverless modules resolve with .js imports, bundled data folder, and synced claims/custom JSON fallbacks into public data.
