import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { Plugin } from "vite";
import { parseClaimPayload } from "./lib/server/claim-utils";
import { readClaims, writeClaims } from "./lib/server/claims";
import { invalidateListingsCache, addCustomListing } from "./lib/server/listings";

const devClaimsMiddleware = (): Plugin => ({
  name: "dev-claims-middleware",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use("/api/claims", (req, res, next) => {
      if (req.method !== "POST") {
        res.statusCode = 405;
        res.setHeader("Allow", "POST");
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }

      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", async () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          const { slug, claim } = parseClaimPayload(parsed);
          const claims = await readClaims();
          claims[slug] = { ...(claims[slug] ?? {}), ...claim };
          await writeClaims(claims);
          invalidateListingsCache();
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          const message = error instanceof Error ? error.message : "Invalid claim submission";
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: message }));
        }
      });
    });

    server.middlewares.use("/api/create-listing", (req, res, next) => {
      if (req.method !== "POST") {
        res.statusCode = 405;
        res.setHeader("Allow", "POST");
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", async () => {
        try {
          const payload = body ? JSON.parse(body) : {};
          const name = typeof payload.name === "string" ? payload.name.trim() : "";
          if (!name) {
            throw new Error("Name is required");
          }
          const slug = devSlugify(name);
          const listing = {
            id: `custom-${Date.now()}`,
            slug,
            name,
            url: payload.website || "",
            location: payload.location || "",
            address: payload.address || "",
            primaryCategory: payload.primaryCategory || "Local Business",
            tags: payload.primaryCategory ? [payload.primaryCategory] : ["Local Business"],
            imageUrl: PLACEHOLDER_IMAGE,
            remoteImageUrl: PLACEHOLDER_IMAGE,
            description: payload.description || "Description coming soon.",
            contacts: {
              website: payload.website ? [payload.website] : [],
              phone: payload.phone ? [payload.phone] : [],
              email: payload.email ? [payload.email] : [],
            },
            featuredInstagramPosts: Array.isArray(payload.instagramPosts)
              ? payload.instagramPosts.filter((url: string) => Boolean(url)).slice(0, 8)
              : [],
          };
          await addCustomListing(listing);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true, slug }));
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to add business";
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: message }));
        }
      });
    });
  },
});

const PLACEHOLDER_IMAGE = "https://placehold.co/600x400?text=Samui+Connect";

const devSlugify = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || `listing-${Date.now()}`;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger(), mode === "development" && devClaimsMiddleware()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
