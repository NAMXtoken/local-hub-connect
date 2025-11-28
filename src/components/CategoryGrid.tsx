import { Utensils, BedDouble, ShoppingBag, Sparkles, Briefcase, Map, Wine, Home } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

const categories = [
  { name: "Food & Beverage", icon: Utensils, count: 548, color: "bg-red-500" },
  { name: "Accommodation", icon: BedDouble, count: 300, color: "bg-indigo-500" },
  { name: "Shopping", icon: ShoppingBag, count: 95, color: "bg-pink-500" },
  { name: "Beauty & Wellness", icon: Sparkles, count: 106, color: "bg-emerald-500" },
  { name: "Professional Services", icon: Briefcase, count: 116, color: "bg-blue-500" },
  { name: "Things To Do", icon: Map, count: 97, color: "bg-amber-500" },
  { name: "Bars & Nightlife", icon: Wine, count: 57, color: "bg-purple-500" },
  { name: "Property Services", icon: Home, count: 67, color: "bg-orange-500" },
];

export const CategoryGrid = () => {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Browse by Category
          </h2>
          <p className="text-muted-foreground text-lg">
            Explore businesses across various categories
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            const categoryQuery = new URLSearchParams({ category: category.name }).toString();
            return (
              <Link key={category.name} to={`/directory?${categoryQuery}`}>
                <Card className="p-6 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className={`${category.color} p-4 rounded-xl group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">{category.count} businesses</p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
