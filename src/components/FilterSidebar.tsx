import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const categories = [
  "Restaurants",
  "Shopping",
  "Services",
  "Health & Medical",
  "Cafes & Bars",
  "Retail",
  "Home Services",
  "Automotive",
];

export const FilterSidebar = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [distance, setDistance] = useState([10]);
  const [priceRange, setPriceRange] = useState([1, 4]);
  const [rating, setRating] = useState([3]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setDistance([10]);
    setPriceRange([1, 4]);
    setRating([3]);
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    distance[0] !== 10 ||
    priceRange[0] !== 1 ||
    priceRange[1] !== 4 ||
    rating[0] !== 3;

  return (
    <Card className="p-6 sticky top-20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg text-foreground">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Categories */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">Category</Label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {categories.map((category) => (
              <div key={category} className="flex items-center gap-2">
                <Checkbox
                  id={category}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => toggleCategory(category)}
                />
                <label
                  htmlFor={category}
                  className="text-sm text-foreground cursor-pointer flex-1"
                >
                  {category}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Categories */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((category) => (
              <Badge
                key={category}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => toggleCategory(category)}
              >
                {category}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}

        {/* Rating */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Minimum Rating: {rating[0]}+ stars
          </Label>
          <Slider
            value={rating}
            onValueChange={setRating}
            max={5}
            min={1}
            step={0.5}
            className="w-full"
          />
        </div>

        {/* Distance */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Distance: Within {distance[0]} km
          </Label>
          <Slider
            value={distance}
            onValueChange={setDistance}
            max={50}
            min={1}
            step={1}
            className="w-full"
          />
        </div>

        {/* Price Range */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Price Range: {"$".repeat(priceRange[0])} - {"$".repeat(priceRange[1])}
          </Label>
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
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
