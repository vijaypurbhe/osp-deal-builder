import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { NAV_GROUPS, ALL_NAV_ITEMS } from "@/lib/navigation";
import { useDeal } from "@/context/DealContext";
import { useDeals, useScenarios } from "@/hooks/useDealData";
import { useDuplicateDeal } from "@/hooks/useDealMutations";
import NewDealDialog from "@/components/deals/NewDealDialog";
import ShareDealDialog from "@/components/deals/ShareDealDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { DEAL_ROLES } from "@/types/deal";
import { Eye, FlaskConical, LogOut, Menu, Plus, Share2, UserRound } from "lucide-react";

const ROLE_LABEL: Record<string, string> = Object.fromEntries(DEAL_ROLES.map((r) => [r.key, r.label]));

function SidebarContent({ onNavigate, isAdmin }: { onNavigate?: () => void; isAdmin: boolean }) {
  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((item) => !item.adminOnly || isAdmin);
        if (!items.length) return null;
        return (
          <div key={group.label}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group.label}</p>
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive ? "bg-primary/10 font-medium text-primary" : "text-foreground/70 hover:bg-muted hover:text-foreground",
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}


export default function AppShell() {
  const {
    profile, roles, signOut, activeScenarioId, setActiveScenarioId, activeDealId, setActiveDealId,
    canEdit, canCreateDeals, isAdmin, activeDealAccess, readOnlyReason,
  } = useDeal();
  const { data: deals } = useDeals();
  const { data: scenarios } = useScenarios();
  const duplicate = useDuplicateDeal();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [newDeal, setNewDeal] = useState(false);
  const [share, setShare] = useState(false);
  const activeDeal = (deals ?? []).find((d) => d.id === activeDealId) ?? null;
  const isSharedSandbox = !!activeDeal?.is_simulation && !activeDeal?.owner_id;
  const current = ALL_NAV_ITEMS.find((i) => (i.to === "/" ? pathname === "/" : pathname.startsWith(i.to)));


  // Default to the first non-archived deal so pages are never blank.
  useEffect(() => {
    if (!deals?.length) return;
    if (activeDealId && deals.some((d) => d.id === activeDealId)) return;
    setActiveDealId((deals.find((d) => !d.is_archived) ?? deals[0]).id);
  }, [deals, activeDealId, setActiveDealId]);

  // Default to the recommended (or first) scenario so pages are never blank.
  useEffect(() => {
    if (!scenarios?.length) return;
    if (activeScenarioId && scenarios.some((s) => s.id === activeScenarioId)) return;
    setActiveScenarioId((scenarios.find((s) => s.is_recommended) ?? scenarios[0]).id);
  }, [scenarios, activeScenarioId, setActiveScenarioId]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SidebarContent onNavigate={() => setOpen(false)} isAdmin={isAdmin} />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary font-display text-sm font-bold text-primary-foreground">TM</div>
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold">Tech Mahindra Salesforce OSP Deal Builder</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {activeDeal ? `${activeDeal.customer_name} · ${activeDeal.name}` : "Select a deal to begin"}
                {activeDeal?.is_simulation && (
                  <Badge variant="outline" className="text-[10px] font-normal">Simulation</Badge>
                )}
                {activeDeal && activeDealAccess === "owner" && !isSharedSandbox && (
                  <Badge variant="secondary" className="text-[10px] font-normal">Owner</Badge>
                )}
                {activeDeal && activeDealAccess === "viewer" && (
                  <Badge variant="outline" className="gap-1 text-[10px] font-normal"><Eye className="h-3 w-3" /> Viewer</Badge>
                )}
              </p>

            </div>
          </div>


          <div className="ml-auto flex items-center gap-2">
            <Select value={activeDealId ?? undefined} onValueChange={setActiveDealId}>
              <SelectTrigger className="hidden w-[220px] md:flex" aria-label="Active deal">
                <SelectValue placeholder="Select deal" />
              </SelectTrigger>
              <SelectContent>
                {(deals ?? []).map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                    {d.is_archived ? " (archived)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" aria-label="New deal" disabled={!canEdit} onClick={() => setNewDeal(true)}>
              <Plus className="h-4 w-4" />
            </Button>

            <Select value={activeScenarioId ?? undefined} onValueChange={setActiveScenarioId}>
              <SelectTrigger className="hidden w-[230px] md:flex" aria-label="Active scenario">
                <SelectValue placeholder="Select scenario" />
              </SelectTrigger>
              <SelectContent>
                {(scenarios ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account menu">
                  <UserRound className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="space-y-1">
                  <p className="text-sm font-medium">{profile?.display_name ?? profile?.email ?? "Signed in"}</p>
                  <div className="flex flex-wrap gap-1">
                    {roles.length ? (
                      roles.map((r) => (
                        <Badge key={r} variant="secondary" className="text-[10px] font-normal">
                          {ROLE_LABEL[r] ?? r}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-normal">
                        Read only
                      </Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void signOut()}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <NewDealDialog open={newDeal} onOpenChange={setNewDeal} />

      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-72 shrink-0 border-r bg-card lg:block">
          <SidebarContent isAdmin={isAdmin} />
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">
          {current && (
            <div className="mb-6">
              <h1 className="font-display text-2xl font-semibold tracking-tight">{current.label}</h1>
              <p className="text-sm text-muted-foreground">{current.description}</p>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
