import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LayoutPreferenceProvider } from "@/contexts/layout-preference";
import Index from "./pages/Index";
import Directory from "./pages/Directory";
import BusinessDetail from "./pages/BusinessDetail";
import ClaimBusiness from "./pages/ClaimBusiness";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LayoutPreferenceProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/business/new" element={<ClaimBusiness mode="create" />} />
            <Route path="/business/:slug/claim" element={<ClaimBusiness />} />
            <Route path="/business/:slug" element={<BusinessDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LayoutPreferenceProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
