import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrandingEffects } from "@/lib/store";
import { ConfirmProvider } from "@/components/ConfirmProvider";
import Index from "./pages/Index";
import Hotels from "./pages/Hotels";
import HotelDetail from "./pages/HotelDetail";
import Rentals from "./pages/Rentals";
import Packages from "./pages/Packages";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Track from "./pages/Track";
import Admin from "./pages/Admin";
import StaticPage from "./pages/StaticPage";
import Faqs from "./pages/Faqs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ConfirmProvider>
      <TooltipProvider>
        <BrandingEffects />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/hotels" element={<Hotels />} />
            <Route path="/hotels/:id" element={<HotelDetail />} />
            <Route path="/rentals" element={<Rentals />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/track" element={<Track />} />
            <Route path="/about" element={<StaticPage which="about" />} />
            <Route path="/privacy" element={<StaticPage which="privacy" />} />
            <Route path="/terms" element={<StaticPage which="terms" />} />
            <Route path="/refund" element={<StaticPage which="refund" />} />
            <Route path="/faqs" element={<Faqs />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ConfirmProvider>
  </QueryClientProvider>
);

export default App;
