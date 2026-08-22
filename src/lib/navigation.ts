import {
  LayoutDashboard, Boxes, GitCompareArrows, SlidersHorizontal, Users, Database, Bot, Network, Wrench,
  Percent, FileSignature, Upload, MessageSquareWarning, ShieldAlert, Settings, Briefcase, Library,
  Building2, LineChart, Handshake, Gauge, Coins, Sparkles, CloudCog, Swords, BadgeCheck, ShieldCheck,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  description: string;
  /** Only rendered for OSP platform admins. */
  adminOnly?: boolean;


export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "OSP deal workspace", to: "/", icon: LayoutDashboard, description: "Every customer, deal and simulation in one place" },
      { label: "Customers", to: "/customers", icon: Building2, description: "Account profiles, platform estate and deal history" },
      { label: "Deals", to: "/deals", icon: Briefcase, description: "Create, open and manage every OSP deal and simulation" },
    ],
  },
  {
    label: "Active deal",
    items: [
      { label: "Deal dashboard", to: "/deal", icon: Gauge, description: "Deal value, coverage, health and approval posture" },
      { label: "Commercial economics", to: "/economics", icon: Coins, description: "Layered BOM, buy/sell economics and gross margin" },
      { label: "SKU catalogue", to: "/catalogue", icon: Boxes, description: "SKUs and price points used in this deal" },
      { label: "SKU library", to: "/sku-library", icon: Library, description: "Reusable master list of Salesforce SKUs" },
    ],
  },
  {
    label: "Deal shaping",
    items: [
      { label: "Scenario builder", to: "/scenarios", icon: SlidersHorizontal, description: "Configure and price scenarios" },
      { label: "Scenario comparison", to: "/compare", icon: GitCompareArrows, description: "Side-by-side ACV and TCV comparison" },
      { label: "Discount workbench", to: "/discounts", icon: Percent, description: "Waterfall, tiers and approval thresholds" },
      { label: "Innovation fund", to: "/innovation-fund", icon: Sparkles, description: "Transformation fund sizing and drawdown" },
      { label: "Cloud marketplace", to: "/marketplace", icon: CloudCog, description: "Private offers, commitment drawdown and fees" },
      { label: "Competitive displacement", to: "/displacement", icon: Swords, description: "Incumbent platform replacement business case" },
      { label: "Order form builder", to: "/order-forms", icon: FileSignature, description: "Assemble order forms per tower" },
    ],
  },
  {
    label: "Modelers",
    items: [
      { label: "Growth model", to: "/models/growth", icon: Users, description: "User growth bridge and rationalisation" },
      { label: "Data 360", to: "/models/data360", icon: Database, description: "Credits, buffers and marketing units" },
      { label: "Agentforce", to: "/models/agentforce", icon: Bot, description: "Add-on seats and Flex credit consumption" },
      { label: "MuleSoft", to: "/models/mulesoft", icon: Network, description: "vCore capacity planning and headroom" },
      { label: "ServiceMax", to: "/models/servicemax", icon: Wrench, description: "Field service user ramp" },
    ],
  },
  {
    label: "Portfolio",
    items: [
      { label: "Portfolio analytics", to: "/portfolio", icon: LineChart, description: "Leadership roll-up across every deal" },
      { label: "Benchmarks", to: "/benchmarks", icon: Gauge, description: "Compare this deal to portfolio averages" },
      { label: "Partner view", to: "/partner", icon: Handshake, description: "Salesforce-facing account planning view" },
    ],
  },
  {
    label: "Governance",
    items: [
      { label: "Validation centre", to: "/validation", icon: BadgeCheck, description: "Universal, Salesforce and customer-specific checks" },
      { label: "Data import", to: "/import", icon: Upload, description: "Load SKU workbooks and pricing extracts" },
      { label: "Discussion log", to: "/discussion", icon: MessageSquareWarning, description: "Open questions with the customer and vendor" },
      { label: "Risk register", to: "/risks", icon: ShieldAlert, description: "Commercial and delivery exposure" },
      { label: "Settings", to: "/settings", icon: Settings, description: "Profile, roles and deal defaults" },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
