import { Header } from "@/components/Header";
import { FilterSidebar, type FilterState } from "@/components/FilterSidebar";
import { BusinessCard } from "@/components/BusinessCard";
import { useListings } from "@/hooks/use-listings";
import { useMemo, useState } from "react";

const PLACEHOLDER_LOCATION = "Koh Samui";

const Directory = () => {
  const { data: listings = [], isLoading, isError } = useListings();
  const listingData = listings ?? [];
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    locations: [],
    search: "",
    distance: 10,
    priceRange: [1, 4],
    rating: 3,
  });

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    listingData.forEach((listing) => {
      const category = listing.primaryCategory || listing.tags[0];
      if (category) {
        set.add(category);
      }
    });
    return Array.from(set).sort();
  }, [listingData]);

  const availableLocations = useMemo(() => {
    const set = new Set<string>();
    listingData.forEach((listing) => {
      const location = listing.location;
      if (location) {
        set.add(location);
      }
    });
    return Array.from(set).sort();
  }, [listingData]);

  const normalizedSearch = filters.search.trim().toLowerCase();

  const businesses = useMemo(() => {
    return listingData
      .filter((listing) => {
        if (
          filters.categories.length > 0 &&
          !filters.categories.includes(
            listing.primaryCategory || listing.tags[0] || ""
          )
        ) {
          return false;
        }

        if (
          filters.locations.length > 0 &&
          !filters.locations.includes(listing.location || "")
        ) {
          return false;
        }

        if (normalizedSearch) {
          const haystack = [
            listing.name,
            listing.description,
            listing.location,
            listing.tags.join(" "),
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(normalizedSearch)) {
            return false;
          }
        }

        return true;
      })
      .map((listing) => ({
        id: listing.id,
        slug: listing.slug,
        name: listing.name || "Untitled Listing",
        category: listing.primaryCategory || listing.tags[0] || "Local Business",
        image: listing.imageUrl || listing.remoteImageUrl,
        rating: null,
        reviews: null,
        location: listing.location || listing.address || PLACEHOLDER_LOCATION,
        priceRange: null,
        phone: listing.contacts?.phone?.[0],
        isOpen: true,
        bumps: 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [listingData, filters.categories, filters.locations, normalizedSearch]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Business Directory
          </h1>
          <p className="text-muted-foreground">
            {isLoading && "Loading businesses..."}
            {isError && "Unable to load businesses."}
            {!isLoading && !isError && `Showing ${businesses.length} businesses`}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-80 flex-shrink-0">
            <FilterSidebar
              filters={filters}
              categories={availableCategories}
              locations={availableLocations}
              onChange={setFilters}
            />
          </aside>

          <main className="flex-1">
            {isLoading ? (
              <p className="text-muted-foreground">Fetching listings...</p>
            ) : isError ? (
              <p className="text-destructive">Something went wrong while loading listings.</p>
            ) : businesses.length === 0 ? (
              <p className="text-muted-foreground">
                No listings match the current filters. Try clearing them or adjusting your search.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {businesses.map((business) => (
                  <BusinessCard key={business.id} {...business} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Directory;
