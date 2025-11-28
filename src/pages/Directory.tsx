import { Header } from "@/components/Header";
import { FilterSidebar, type FilterState } from "@/components/FilterSidebar";
import { BusinessCard } from "@/components/BusinessCard";
import { DirectoryMap } from "@/components/DirectoryMap";
import { useListings } from "@/hooks/use-listings";
import { useMemo, useState } from "react";

const PLACEHOLDER_LOCATION = "Koh Samui";

const Directory = () => {
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    locations: [],
    search: "",
    distance: 10,
    priceRange: [1, 4],
    rating: 3,
  });

  const noFiltersActive =
    filters.categories.length === 0 &&
    filters.locations.length === 0 &&
    !filters.search.trim();

  const baseQuery = useListings();
  const filteredQuery = useListings(
    {
      categories: filters.categories,
      locations: filters.locations,
      search: filters.search,
    },
    { enabled: !noFiltersActive }
  );

  const listingData = (noFiltersActive ? baseQuery.data : filteredQuery.data) ?? [];
  const isLoading = noFiltersActive ? baseQuery.isLoading : filteredQuery.isLoading;
  const isError = noFiltersActive ? baseQuery.isError : filteredQuery.isError;
  const totalCount = listingData.length;

  const availableCategories = useMemo(() => {
    const source = baseQuery.data ?? listingData;
    const set = new Set<string>();
    source.forEach((listing) => {
      const category = listing.primaryCategory || listing.tags[0];
      if (category) {
        set.add(category);
      }
    });
    return Array.from(set).sort();
  }, [baseQuery.data, listingData]);

  const availableLocations = useMemo(() => {
    const source = baseQuery.data ?? listingData;
    const set = new Set<string>();
    source.forEach((listing) => {
      const location = listing.location;
      if (location) {
        set.add(location);
      }
    });
    return Array.from(set).sort();
  }, [baseQuery.data, listingData]);

  const businesses = useMemo(
    () =>
      listingData
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
        .sort((a, b) => a.name.localeCompare(b.name)),
    [listingData]
  );

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
            {!isLoading && !isError && `Showing ${totalCount} businesses`}
          </p>
        </div>

        <div className="mb-10">
          <DirectoryMap listings={listingData} />
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
