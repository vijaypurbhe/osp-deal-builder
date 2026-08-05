import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DealProvider } from "@/context/DealContext";
import RequireAuth from "@/components/layout/RequireAuth";
import AppShell from "@/components/layout/AppShell";

import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import CataloguePage from "@/pages/CataloguePage";
import ScenarioBuilderPage from "@/pages/ScenarioBuilderPage";
import ScenarioComparePage from "@/pages/ScenarioComparePage";
import DiscountWorkbenchPage from "@/pages/DiscountWorkbenchPage";
import OrderFormPage from "@/pages/OrderFormPage";
import GrowthModelPage from "@/pages/models/GrowthModelPage";
import Data360Page from "@/pages/models/Data360Page";
import AgentforcePage from "@/pages/models/AgentforcePage";
import MuleSoftPage from "@/pages/models/MuleSoftPage";
import ServiceMaxPage from "@/pages/models/ServiceMaxPage";
import ImportPage from "@/pages/ImportPage";
import DiscussionPage from "@/pages/DiscussionPage";
import RiskPage from "@/pages/RiskPage";
import SettingsPage from "@/pages/SettingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <DealProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/catalogue" element={<CataloguePage />} />
              <Route path="/scenarios" element={<ScenarioBuilderPage />} />
              <Route path="/compare" element={<ScenarioComparePage />} />
              <Route path="/discounts" element={<DiscountWorkbenchPage />} />
              <Route path="/order-forms" element={<OrderFormPage />} />
              <Route path="/models/growth" element={<GrowthModelPage />} />
              <Route path="/models/data360" element={<Data360Page />} />
              <Route path="/models/agentforce" element={<AgentforcePage />} />
              <Route path="/models/mulesoft" element={<MuleSoftPage />} />
              <Route path="/models/servicemax" element={<ServiceMaxPage />} />
              <Route path="/import" element={<ImportPage />} />
              <Route path="/discussion" element={<DiscussionPage />} />
              <Route path="/risks" element={<RiskPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DealProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
