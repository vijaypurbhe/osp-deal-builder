import {
  LayoutDashboard, Boxes, GitCompareArrows, SlidersHorizontal, Users, Database, Bot, Network, Wrench,
  Percent, FileSignature, Upload, MessageSquareWarning, ShieldAlert, Settings, Briefcase, Library,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  description: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Executive dashboard", to: "/", icon: LayoutDashboard, description: "Deal value, coverage and approval posture" },
      { label: "Deals", to: "/deals", icon: Briefcase, description: "Create, open and manage every OSP deal" },
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
    label: "Governance",
    items: [
      { label: "Data import", to: "/import", icon: Upload, description: "Load SKU workbooks and pricing extracts" },
      { label: "Discussion log", to: "/discussion", icon: MessageSquareWarning, description: "Open questions with the customer and vendor" },
      { label: "Risk register", to: "/risks", icon: ShieldAlert, description: "Commercial and delivery exposure" },
      { label: "Settings", to: "/settings", icon: Settings, description: "Profile, roles and deal defaults" },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
