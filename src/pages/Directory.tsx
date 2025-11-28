import { Header } from "@/components/Header";
import { FilterSidebar, type FilterState } from "@/components/FilterSidebar";
import { DirectoryMap } from "@/components/DirectoryMap";
import { DirectoryListItem } from "@/components/DirectoryListItem";
import { BusinessCard } from "@/components/BusinessCard";
import { Button } from "@/components/ui/button";
import { useListings } from "@/hooks/use-listings";
import { useLayoutPreference } from "@/contexts/layout-preference";
import { useMemo, useState, useEffect } from "react";

const Directory = () => {
  const { viewMode } = useLayoutPreference();
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

  const [visibleListingIds, setVisibleListingIds] = useState<string[]>([]);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

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

  const sortedListingData = useMemo(() => {
    return [...listingData].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [listingData]);

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

  useEffect(() => {
    setVisibleListingIds(listingData.map((listing) => listing.id));
  }, [listingData]);

  const explorerListings = useMemo(() => {
    if (!visibleListingIds.length) return sortedListingData;
    const idSet = new Set(visibleListingIds);
    const filtered = sortedListingData.filter((listing) => idSet.has(listing.id));
    return filtered;
  }, [sortedListingData, visibleListingIds]);
  const explorerCount = explorerListings.length;

  const businessCards = useMemo(
    () =>
      sortedListingData
        .map((listing) => ({
          id: listing.id,
          slug: listing.slug,
          name: listing.name || "Untitled Listing",
          category: listing.primaryCategory || listing.tags[0] || "Local Business",
          image: listing.imageUrl || listing.remoteImageUrl,
          rating: null,
          reviews: null,
          location: listing.location || listing.address || "Koh Samui",
          priceRange: null,
          phone: listing.contacts?.phone?.[0],
          isOpen: true,
          bumps: 0,
        })),
    [sortedListingData]
  );

  const classicLayout = (
    <div className="container mx-auto px-4 py-8 flex-1 w-full">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Business Directory</h1>
        <p className="text-muted-foreground">
          {isLoading && "Loading businesses..."}
          {isError && "Unable to load businesses."}
          {!isLoading && !isError && `Showing ${totalCount} businesses`}
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
          ) : businessCards.length === 0 ? (
            <p className="text-muted-foreground">
              No listings match the current filters. Try clearing them or adjusting your search.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {businessCards.map((business) => (
                <BusinessCard key={business.id} {...business} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );

  const explorerLayout = (
    <div className="flex flex-1 flex-col lg:flex-row lg:h-[calc(100vh-64px)]">
      <aside className="w-full lg:w-[420px] xl:w-[480px] border-b lg:border-r bg-background flex flex-col lg:h-full lg:overflow-hidden">
        <div className="border-b px-6 py-5 flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">Directory</p>
          <h1 className="text-2xl font-bold text-foreground">Samui Connect</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading && "Loading businesses..."}
            {isError && "Unable to load businesses."}
            {!isLoading && !isError && `${explorerCount} businesses match your filters`}
          </p>
          <div className="hidden md:flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFiltersCollapsed((prev) => !prev)}
            >
              {filtersCollapsed ? "Show Filters" : "Hide Filters"}
            </Button>
          </div>
        </div>

        <div className="border-b px-4 py-4 md:hidden">
          <details className="group">
            <summary className="flex items-center justify-between text-sm font-semibold text-foreground cursor-pointer">
              Filters
              <span className="text-xs text-muted-foreground">Tap to toggle</span>
            </summary>
            <div className="mt-4">
              <FilterSidebar
                filters={filters}
                categories={availableCategories}
                locations={availableLocations}
                onChange={setFilters}
              />
            </div>
          </details>
        </div>

        {!filtersCollapsed && (
          <div className="hidden md:block border-b px-4 py-4 max-h-[45vh] overflow-y-auto">
            <FilterSidebar
              filters={filters}
              categories={availableCategories}
              locations={availableLocations}
              onChange={setFilters}
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30 lg:h-full">
          {isLoading ? (
            <p className="text-muted-foreground">Fetching listings...</p>
          ) : isError ? (
            <p className="text-destructive">Something went wrong while loading listings.</p>
          ) : explorerListings.length === 0 ? (
            <p className="text-muted-foreground">
              No listings match the current filters. Try clearing them or adjusting your search.
            </p>
          ) : (
            explorerListings.map((listing, index) => (
              <DirectoryListItem key={`${listing.id}-${index}`} listing={listing} rank={index + 1} />
            ))
          )}
        </div>
      </aside>

      <div className="flex-1 relative h-[360px] lg:h-full">
        <div className="lg:fixed lg:right-0 lg:top-16 lg:bottom-0 lg:left-[420px] xl:left-[480px]">
          <DirectoryMap
            listings={listingData}
            className="h-[360px] lg:h-full w-full rounded-none border-0"
            onVisibleListingsChange={setVisibleListingIds}
          />
        </div>
        <div className="pointer-events-none absolute top-6 left-6 hidden lg:flex flex-col gap-2">
          <div className="pointer-events-auto bg-background/90 backdrop-blur rounded-2xl shadow-lg px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Viewing</p>
            <p className="text-lg font-semibold text-foreground">{explorerCount} listings on map</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      {viewMode === "explorer" ? (
        <div className="flex-1 flex flex-col lg:overflow-hidden">{explorerLayout}</div>
      ) : (
        <div className="flex-1 flex flex-col">{classicLayout}</div>
      )}
    </div>
  );
};

export default Directory;
