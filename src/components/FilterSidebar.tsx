import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

export interface FilterState {
  categories: string[];
  locations: string[];
  search: string;
  distance: number;
  priceRange: [number, number];
  rating: number;
}

interface FilterSidebarProps {
  filters: FilterState;
  categories: string[];
  locations: string[];
  onChange: (next: FilterState) => void;
}

const toggleValue = (values: string[], value: string) =>
  values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];

export const FilterSidebar = ({ filters, categories, locations, onChange }: FilterSidebarProps) => {
  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.locations.length > 0 ||
    Boolean(filters.search.trim()) ||
    filters.distance !== 10 ||
    filters.priceRange[0] !== 1 ||
    filters.priceRange[1] !== 4 ||
    filters.rating !== 3;

  const update = (partial: Partial<FilterState>) => {
    onChange({ ...filters, ...partial });
  };

  return (
    <Card className="p-6 sticky top-20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg text-foreground">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({
                categories: [],
                locations: [],
                search: "",
                distance: 10,
                priceRange: [1, 4],
                rating: 3,
              })
            }
            className="h-8 text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <Label className="text-sm font-semibold mb-3 block">Search</Label>
          <Input
            value={filters.search}
            onChange={(event) => update({ search: event.target.value })}
            placeholder="Search by name, tag, or description"
          />
        </div>

        {/* Categories */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">Category</Label>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {categories.map((category) => (
              <div key={category} className="flex items-center gap-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={() => update({ categories: toggleValue(filters.categories, category) })}
                />
                <label
                  htmlFor={`category-${category}`}
                  className="text-sm text-foreground cursor-pointer flex-1"
                >
                  {category}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">Location</Label>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {locations.map((location) => (
              <div key={location} className="flex items-center gap-2">
                <Checkbox
                  id={`location-${location}`}
                  checked={filters.locations.includes(location)}
                  onCheckedChange={() => update({ locations: toggleValue(filters.locations, location) })}
                />
                <label
                  htmlFor={`location-${location}`}
                  className="text-sm text-foreground cursor-pointer flex-1"
                >
                  {location}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {filters.categories.map((category) => (
              <Badge
                key={`chip-${category}`}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => update({ categories: toggleValue(filters.categories, category) })}
              >
                {category}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
            {filters.locations.map((location) => (
              <Badge
                key={`chip-${location}`}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => update({ locations: toggleValue(filters.locations, location) })}
              >
                {location}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
            {filters.search.trim() && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => update({ search: "" })}
              >
                Search: {filters.search}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
          </div>
        )}

        {/* Rating */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Minimum Rating: {filters.rating}+ stars
          </Label>
          <Slider
            value={[filters.rating]}
            onValueChange={(value) => update({ rating: value[0] ?? filters.rating })}
            max={5}
            min={1}
            step={0.5}
            className="w-full"
          />
        </div>

        {/* Distance */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Distance: Within {filters.distance} km
          </Label>
          <Slider
            value={[filters.distance]}
            onValueChange={(value) => update({ distance: value[0] ?? filters.distance })}
            max={50}
            min={1}
            step={1}
            className="w-full"
          />
        </div>

        {/* Price Range */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Price Range: {"฿".repeat(filters.priceRange[0])} - {"฿".repeat(filters.priceRange[1])}
          </Label>
          <Slider
            value={filters.priceRange}
            onValueChange={(value) =>
              update({
                priceRange: [value[0] ?? filters.priceRange[0], value[1] ?? filters.priceRange[1]] as [number, number],
              })
            }
            max={4}
            min={1}
            step={1}
            className="w-full"
            minStepsBetweenThumbs={0}
          />
        </div>

        <Button className="w-full" size="lg">
          Apply Filters
        </Button>
      </div>
    </Card>
  );
};
