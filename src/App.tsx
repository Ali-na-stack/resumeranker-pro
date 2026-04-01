import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "./pages/Dashboard";
import CandidatesPage from "./pages/CandidatesPage";
import CandidateDetail from "./pages/CandidateDetail";
import ComparePage from "./pages/ComparePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [biasReduction, setBiasReduction] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <AppSidebar biasReduction={biasReduction} onBiasReductionChange={setBiasReduction} />
              <Routes>
                <Route path="/" element={<Dashboard biasReduction={biasReduction} />} />
                <Route path="/candidates" element={<CandidatesPage biasReduction={biasReduction} />} />
                <Route path="/shortlisted" element={<CandidatesPage biasReduction={biasReduction} filterStatus="shortlisted" />} />
                <Route path="/candidate/:id" element={<CandidateDetail biasReduction={biasReduction} />} />
                <Route path="/compare" element={<ComparePage biasReduction={biasReduction} />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
