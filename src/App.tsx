import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PageTracker } from "@/components/PageTracker";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { SplashScreen } from "@/components/SplashScreen";
import { initializeAdMob } from "@/lib/admob";
import { NativeAdBanner } from "@/components/NativeAdBanner";
import Index from "./pages/Index";
import About from "./pages/About";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Exam from "./pages/Exam";
import ExamTaking from "./pages/ExamTaking";
import ExamResults from "./pages/ExamResults";
import JambExam from "./pages/JambExam";
import JambStudyMaterial from "./pages/JambStudyMaterial";
import ApiExam from "./pages/ApiExam";
import Admin from "./pages/Admin";
import Payment from "./pages/Payment";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Initialize native AdMob on app start (no-op on web)
  useEffect(() => {
    initializeAdMob();
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PageTracker />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/exam" element={<Exam />} />
            <Route path="/exam/take/:subjectSlug" element={<ExamTaking />} />
            <Route path="/exam-results/:subjectSlug" element={<ExamResults />} />
            <Route path="/jamb-exam" element={<JambExam />} />
            <Route path="/jamb-study" element={<JambStudyMaterial />} />
            <Route path="/api-exam" element={<ApiExam />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <NativeAdBanner position="BOTTOM" />
          <MobileBottomNav />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
