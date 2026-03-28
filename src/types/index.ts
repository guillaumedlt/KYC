// Types will be generated from Supabase schema
// Run: npx supabase gen types typescript --local > src/types/supabase.ts

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type KycStatus =
  | "not_started"
  | "in_progress"
  | "approved"
  | "rejected"
  | "expired";

export type EntityType =
  | "person"
  | "company"
  | "trust"
  | "foundation"
  | "spv"
  | "fund";

export type RelationType =
  | "ubo"
  | "shareholder"
  | "director"
  | "officer"
  | "trustee"
  | "beneficiary"
  | "settlor"
  | "protector"
  | "nominee"
  | "family_spouse"
  | "family_child"
  | "family_parent"
  | "associate"
  | "authorized_signatory"
  | "legal_representative";

export type ScreeningList = "un" | "eu" | "monaco" | "ofac" | "uk_hmt";

export type VigilanceLevel = "simplified" | "standard" | "enhanced" | "prohibited";
