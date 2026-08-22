import { z } from "zod";

/** Shared field primitives so every form and mutation validates the same way. */
export const pct = z
  .number({ invalid_type_error: "Enter a number" })
  .min(0, "Cannot be negative")
  .max(100, "Cannot exceed 100%");

export const money = z
  .number({ invalid_type_error: "Enter a number" })
  .min(0, "Cannot be negative")
  .max(1_000_000_000_000, "Value is unrealistically large");

export const qty = z
  .number({ invalid_type_error: "Enter a number" })
  .min(0, "Cannot be negative")
  .max(10_000_000, "Quantity is unrealistically large");

export const shortText = (max = 160) => z.string().trim().min(1, "Required").max(max, `Keep under ${max} characters`);
export const optionalText = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max, `Keep under ${max} characters`)
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v ?? null));

export const CURRENCIES = ["USD", "GBP", "EUR", "AUD", "CAD", "CHF", "INR", "JPY", "SGD", "AED"] as const;
export const currency = z.enum(CURRENCIES, { errorMap: () => ({ message: "Use a supported 3-letter currency code" }) });

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v ?? null));

const orderedDates = <T extends { contract_start?: string | null; contract_end?: string | null }>(schema: z.ZodType<T>) =>
  schema.refine((v) => !v.contract_start || !v.contract_end || v.contract_end > v.contract_start, {
    message: "Contract end must be after contract start",
    path: ["contract_end"],
  });

/* ---------------- Deal ---------------- */

export const dealSchema = orderedDates(
  z.object({
    name: shortText(120),
    customer_name: shortText(120),
    partner_name: shortText(120),
    currency,
    contract_years: z.number().min(0.25, "At least 0.25 years").max(15, "At most 15 years"),
    contract_start: isoDate,
    contract_end: isoDate,
    close_date: isoDate,
    opportunity_id: optionalText(64),
    region: optionalText(64),
    notes: optionalText(4000),
    current_salesforce_acv: money,
    renewal_uplift_pct: pct,
    min_license_gm_pct: pct,
    services_gm_target_pct: pct,
  }),
);
export type DealInput = z.input<typeof dealSchema>;

/* ---------------- Scenario ---------------- */

export const scenarioSchema = z.object({
  name: shortText(120),
  description: optionalText(1000),
  currency,
  scenario_discount_pct: pct,
  bulk_discount_pct: pct,
  strategic_override_pct: pct,
  approval_threshold_pct: pct,
});

/* ---------------- SKU line ---------------- */

export const skuLineSchema = z
  .object({
    sku_name: shortText(200),
    sku_code: optionalText(64),
    quantity: qty,
    unit_list_price: money,
    unit_of_measure: shortText(40),
    line_discount_pct: pct,
    category_discount_pct: pct,
    max_discount_pct: pct,
    acquisition_unit_price: money,
    current_contract_unit_price: money,
  })
  .refine((v) => v.line_discount_pct + v.category_discount_pct <= 100, {
    message: "Combined line and category discount cannot exceed 100%",
    path: ["line_discount_pct"],
  });

/* ---------------- Customer ---------------- */

export const customerSchema = z.object({
  name: shortText(120),
  industry: optionalText(80),
  region: optionalText(80),
  country: optionalText(80),
  currency,
  employee_count: z.number().int().min(0).max(10_000_000).optional().nullable(),
  annual_revenue: money.optional().nullable(),
  current_salesforce_acv: money,
  aws_commitment: money,
  azure_commitment: money,
  gcp_commitment: money,
  notes: optionalText(4000),
});

/* ---------------- Commercial modules ---------------- */

export const servicesSchema = z.object({
  name: shortText(160),
  annual_fee: money,
  annual_cost: money,
  implementation_fee: money,
  implementation_cost: money,
  years: z.number().min(0).max(15),
  attach_target_pct: pct,
});

export const innovationFundSchema = z
  .object({
    name: shortText(160),
    total_fund: money,
    salesforce_funded: money,
    techm_funded: money,
    customer_funded: money,
    consumed: money,
  })
  .refine((v) => v.consumed <= v.total_fund, { message: "Consumed cannot exceed the total fund", path: ["consumed"] })
  .refine((v) => v.salesforce_funded + v.techm_funded + v.customer_funded <= v.total_fund * 1.0001, {
    message: "Funding contributions cannot exceed the total fund",
    path: ["total_fund"],
  });

export const marketplaceSchema = z
  .object({
    provider: shortText(40),
    commitment_total: money,
    commitment_remaining: money,
    drawdown_pct: pct,
    marketplace_fee_pct: pct,
  })
  .refine((v) => v.commitment_remaining <= v.commitment_total, {
    message: "Remaining commitment cannot exceed the total commitment",
    path: ["commitment_remaining"],
  });

export const riskSchema = z.object({
  description: shortText(600),
  category: shortText(60),
  owner: optionalText(120),
  notes: optionalText(2000),
});

export const discussionSchema = z.object({
  title: shortText(200),
  area: shortText(60),
  description: optionalText(2000),
  owner: optionalText(120),
});

/* ---------------- Collaboration ---------------- */

export const shareSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid work email").max(255),
  role: z.enum(["viewer", "editor"]),
});

/* ---------------- Imported BOM rows ---------------- */

export const importedLineSchema = z.object({
  sku_name: shortText(200),
  quantity: qty,
  unit_list_price: money,
  unit_of_measure: shortText(40),
  line_discount_pct: pct,
});

export interface RowIssue {
  row: number;
  message: string;
}

/** Validates parsed workbook rows and returns the clean set plus a per-row issue report. */
export function validateImportedLines<T extends Record<string, unknown>>(rows: T[]) {
  const valid: T[] = [];
  const issues: RowIssue[] = [];
  rows.forEach((row, i) => {
    const result = importedLineSchema.safeParse({
      sku_name: row.sku_name,
      quantity: Number(row.quantity ?? 0),
      unit_list_price: Number(row.unit_list_price ?? 0),
      unit_of_measure: row.unit_of_measure || "Unit",
      line_discount_pct: Number(row.line_discount_pct ?? 0),
    });
    if (result.success) valid.push(row);
    else issues.push({ row: i + 1, message: result.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ") });
  });
  return { valid, issues };
}

/** Turns a zod error into a `{ field: message }` map for inline form errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Validates a payload and surfaces the first problem as a message, or null when valid. */
export function firstError(schema: z.ZodTypeAny, value: unknown): string | null {
  const result = schema.safeParse(value);
  if (result.success) return null;
  const issue = result.error.issues[0];
  return issue ? issue.message : "Invalid input";
}
