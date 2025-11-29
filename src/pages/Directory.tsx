import { Header } from "@/components/Header";
import { FilterSidebar, type FilterState } from "@/components/FilterSidebar";
import { DirectoryMap } from "@/components/DirectoryMap";
import { DirectoryListItem } from "@/components/DirectoryListItem";
import { BusinessCard } from "@/components/BusinessCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useListings } from "@/hooks/use-listings";
import { useBumpLeaderboard } from "@/hooks/use-bumps";
import { useLayoutPreference } from "@/contexts/layout-preference";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const DEFAULT_CATEGORY = "Food & Beverage";

const defaultFilterState: FilterState = {
  categories: [DEFAULT_CATEGORY],
  locations: [],
  search: "",
  distance: 10,
  priceRange: [1, 4],
  rating: 3,
};

const parseFiltersFromParams = (params: URLSearchParams) => {
  const extractValues = (key: string) =>
    params
      .getAll(key)
      .map((value) => value.trim())
      .filter(Boolean);

  return {
    categories: extractValues("category"),
    locations: extractValues("location"),
    search: params.get("search")?.trim() ?? "",
  } as Pick<FilterState, "categories" | "locations" | "search">;
};

const normalizeValues = (values: string[], options: string[]) => {
  if (!values.length || !options.length) return values;
  return values.map((value) => {
    const match = options.find((option) => option.toLowerCase() === value.toLowerCase());
    return match ?? value;
  });
};

const arraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
};

const enforceCategorySelection = (categories: string[]) => (categories.length ? categories : [...defaultFilterState.categories]);

const withRequiredCategory = (state: FilterState): FilterState => ({
  ...state,
  categories: enforceCategorySelection(state.categories),
});

const Directory = () => {
  const [searchParams] = useSearchParams();
  const { viewMode } = useLayoutPreference();
  const initialFiltersFromQuery = parseFiltersFromParams(searchParams);
  const [filters, setFiltersState] = useState<FilterState>(() =>
    withRequiredCategory({
      ...defaultFilterState,
      ...initialFiltersFromQuery,
    })
  );
  const setFilters = (updater: FilterState | ((prev: FilterState) => FilterState)) => {
    setFiltersState((prev) => {
      const next = typeof updater === "function" ? (updater as (value: FilterState) => FilterState)(prev) : updater;
      return withRequiredCategory(next);
    });
  };

  const noFiltersActive =
    filters.categories.length === 0 &&
    filters.locations.length === 0 &&
    !filters.search.trim();

  const [visibleListingIds, setVisibleListingIds] = useState<string[]>([]);
  const applyExplorerFilters = (updates: Pick<FilterState, "categories" | "locations" | "search">) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const isMobile = useIsMobile();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setMobileFiltersOpen(!isMobile);
  }, [isMobile]);

  const showExplorerFilters = !isMobile || mobileFiltersOpen;

  const baseQuery = useListings();
  const filteredQuery = useListings(
    {
      categories: filters.categories,
      locations: filters.locations,
      search: filters.search,
    },
    { enabled: !noFiltersActive }
  );

  const { data: leaderboardData } = useBumpLeaderboard({ limit: 500 });

  const activeData = noFiltersActive ? baseQuery.data : filteredQuery.data;
  const listingData = useMemo(() => activeData ?? [], [activeData]);
  const isLoading = noFiltersActive ? baseQuery.isLoading : filteredQuery.isLoading;
  const isError = noFiltersActive ? baseQuery.isError : filteredQuery.isError;
  const totalCount = listingData.length;

  const bumpCountMap = useMemo(() => {
    const map = new Map<string, number>();
    leaderboardData?.items.forEach((item) => {
      map.set(item.slug, item.count);
    });
    return map;
  }, [leaderboardData]);

  const sortedListingData = useMemo(() => {
    return [...listingData].sort((a, b) => {
      const bumpDiff = (bumpCountMap.get(b.slug) ?? 0) - (bumpCountMap.get(a.slug) ?? 0);
      if (bumpDiff !== 0) {
        return bumpDiff;
      }
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [listingData, bumpCountMap]);

  const availableCategories = useMemo(() => {
    const source = baseQuery.data ?? listingData;
    const set = new Set<string>();
    source.forEach((listing) => {
      const category = listing.primaryCategory || listing.tags[0];
      if (category) {
        set.add(category);
      }
    });
    defaultFilterState.categories.forEach((category) => set.add(category));
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
    const derived = parseFiltersFromParams(searchParams);
    setFilters((prev) => {
      if (
        arraysEqual(prev.categories, derived.categories) &&
        arraysEqual(prev.locations, derived.locations) &&
        prev.search === derived.search
      ) {
        return prev;
      }
      return { ...prev, ...derived };
    });
  }, [searchParams]);

  useEffect(() => {
    if (!availableCategories.length && !availableLocations.length) return;
    setFilters((prev) => {
      const normalizedCategories = normalizeValues(prev.categories, availableCategories);
      const normalizedLocations = normalizeValues(prev.locations, availableLocations);
      if (
        arraysEqual(prev.categories, normalizedCategories) &&
        arraysEqual(prev.locations, normalizedLocations)
      ) {
        return prev;
      }
      return {
        ...prev,
        categories: normalizedCategories,
        locations: normalizedLocations,
      };
    });
  }, [availableCategories, availableLocations]);

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
          bumps: bumpCountMap.get(listing.slug) ?? 0,
        })),
    [sortedListingData, bumpCountMap]
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
            defaultCategories={defaultFilterState.categories}
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
              {businessCards.map((business, index) => (
                <BusinessCard
                  key={`${business.slug ?? business.id}-${business.id ?? "na"}-${index}`}
                  {...business}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );

  const explorerLayout = (
    <div className="flex flex-1 flex-col lg:flex-row lg:h-[calc(100vh-64px)]">
      <div className="order-1 lg:order-2 flex-1 relative h-[360px] w-full lg:h-full">
        <div className="lg:fixed lg:right-0 lg:top-16 lg:bottom-0 lg:left-[420px] xl:left-[480px]">
          <div className="relative h-[360px] lg:h-full w-full">
            <DirectoryMap
              listings={listingData}
              className="h-full w-full rounded-none border-0"
              onVisibleListingsChange={setVisibleListingIds}
            />
            <div className="absolute top-4 left-4 right-4 flex flex-col items-end gap-3 pointer-events-none">
              {isMobile && !mobileFiltersOpen && (
                <button
                  type="button"
                  className="pointer-events-auto flex items-center gap-2 rounded-full bg-background/95 px-3 py-2 text-sm font-semibold text-foreground shadow-lg border"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </button>
              )}
              {showExplorerFilters && (
                <div className="pointer-events-auto bg-background/95 backdrop-blur rounded-2xl shadow-lg border px-4 py-3 w-full lg:w-auto">
                  {isMobile && (
                    <div className="flex justify-end pb-2">
                      <button
                        type="button"
                        aria-label="Close filters"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border text-muted-foreground"
                        onClick={() => setMobileFiltersOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <ExplorerFilterBar
                    filters={filters}
                    categories={availableCategories}
                    locations={availableLocations}
                    onApply={applyExplorerFilters}
                  />
                </div>
              )}
            </div>
            <div className="pointer-events-none hidden lg:block absolute bottom-6 right-6">
              <div className="pointer-events-auto bg-background/90 backdrop-blur rounded-2xl shadow-lg px-5 py-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Viewing</p>
                <p className="text-lg font-semibold text-foreground">{explorerCount} listings on map</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside className="order-2 lg:order-1 w-full lg:w-[420px] xl:w-[480px] border-b lg:border-r bg-background flex flex-col lg:h-full lg:overflow-hidden">
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
              <DirectoryListItem
                key={`${listing.slug ?? listing.id}-${listing.id}-${index}`}
                listing={listing}
                rank={index + 1}
              />
            ))
          )}
        </div>
      </aside>
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

interface ExplorerFilterBarProps {
  filters: FilterState;
  categories: string[];
  locations: string[];
  onApply: (updates: Pick<FilterState, "categories" | "locations" | "search">) => void;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: string[];
  emptyLabel?: string;
  allowEmpty?: boolean;
  disabled?: boolean;
  onChange: (next: string) => void;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia("(max-width: 1023px)").matches
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const media = window.matchMedia("(max-width: 1023px)");
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handler);
    } else {
      media.addListener(handler);
    }
    setIsMobile(media.matches);
    return () => {
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", handler);
      } else {
        media.removeListener(handler);
      }
    };
  }, []);

  return isMobile;
}

const ExplorerFilterBar = ({ filters, categories, locations, onApply }: ExplorerFilterBarProps) => {
  const [searchValue, setSearchValue] = useState(filters.search);
  const [categoryValue, setCategoryValue] = useState(filters.categories[0] ?? "");
  const [locationValue, setLocationValue] = useState(filters.locations[0] ?? "");

  useEffect(() => {
    setSearchValue(filters.search);
  }, [filters.search]);

  useEffect(() => {
    setCategoryValue(filters.categories[0] ?? "");
  }, [filters.categories]);

  useEffect(() => {
    setLocationValue(filters.locations[0] ?? "");
  }, [filters.locations]);

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const resolvedCategory = categories.includes(categoryValue)
      ? categoryValue
      : filters.categories[0] ?? categories[0] ?? defaultFilterState.categories[0];
    onApply({
      search: searchValue.trim(),
      categories: resolvedCategory ? [resolvedCategory] : [],
      locations: locationValue ? [locationValue] : [],
    });
  };

  const selectedCategory = categories.includes(categoryValue) ? categoryValue : "";
  const selectedLocation = locations.includes(locationValue) ? locationValue : "";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 lg:flex-row lg:items-end">
      <div className="flex flex-col w-full gap-1">
        <label className="text-xs font-semibold text-muted-foreground" htmlFor="explorer-search">
          Search
        </label>
        <Input
          id="explorer-search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search by name, tag, or description"
          className="h-9 px-2.5"
        />
      </div>

      <SelectField
        label="Category"
        value={selectedCategory || filters.categories[0] || ""}
        options={categories}
        allowEmpty={false}
        onChange={setCategoryValue}
        disabled={categories.length === 0}
      />

      <SelectField
        label="Location"
        value={selectedLocation}
        options={locations}
        emptyLabel="Island Wide"
        onChange={setLocationValue}
        disabled={locations.length === 0}
      />

      <div className="flex w-full lg:w-auto">
        <Button type="submit" className="w-full h-9 lg:h-9 px-3">
          Search
        </Button>
      </div>
    </form>
  );
};

const SelectField = ({ label, value, options, emptyLabel = "Select", allowEmpty = true, disabled, onChange }: SelectFieldProps) => {
  return (
    <div className="flex flex-col w-full lg:max-w-xs gap-1">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="relative">
        <select
          className="appearance-none h-9 w-full rounded-md border border-input bg-background pl-2.5 pr-9 text-sm"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        >
          {allowEmpty && <option value="">{emptyLabel}</option>}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
};
