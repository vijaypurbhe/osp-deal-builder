import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { NAV_GROUPS, ALL_NAV_ITEMS } from "@/lib/navigation";
import { useDeal } from "@/context/DealContext";
import { useScenarios } from "@/hooks/useDealData";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LogOut, Menu, UserRound } from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  deal_architect: "Deal architect",
  salesforce_ae: "Salesforce AE",
  tm_osp_lead: "Tech Mahindra OSP lead",
  sn_reviewer: "Smith+Nephew reviewer",
  finance_reviewer: "Finance reviewer",
};

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group.label}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
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
      ))}
    </nav>
  );
}

export default function AppShell() {
  const { profile, roles, signOut, activeScenarioId, setActiveScenarioId } = useDeal();
  const { data: scenarios } = useScenarios();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const current = ALL_NAV_ITEMS.find((i) => (i.to === "/" ? pathname === "/" : pathname.startsWith(i.to)));

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
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary font-display text-sm font-bold text-primary-foreground">S+N</div>
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold">OSP Deal Builder</p>
              <p className="text-xs text-muted-foreground">Smith+Nephew · Salesforce estate</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
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

      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-72 shrink-0 border-r bg-card lg:block">
          <SidebarContent />
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
