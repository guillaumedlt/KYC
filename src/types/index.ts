// =============================================================================
// Domain types — mirroring the DB schema
// Will be complemented by auto-generated Supabase types later
// =============================================================================

// --- Enums ---

export type TenantType =
  | "bank"
  | "fiduciary"
  | "law_firm"
  | "accounting"
  | "real_estate"
  | "insurance"
  | "wealth_management"
  | "other";

export type UserRole = "admin" | "compliance_officer" | "analyst" | "viewer";

export type EntityType =
  | "person"
  | "company"
  | "trust"
  | "foundation"
  | "spv"
  | "fund";

export type EntityStatus = "active" | "inactive" | "archived";

export type KycStatus =
  | "not_started"
  | "in_progress"
  | "pending_review"
  | "approved"
  | "rejected"
  | "expired";

export type RiskLevel = "low" | "medium" | "high" | "critical";

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

export type CaseStatus =
  | "open"
  | "documents_pending"
  | "screening"
  | "risk_review"
  | "pending_decision"
  | "approved"
  | "rejected"
  | "escalated"
  | "closed";

export type VigilanceLevel = "simplified" | "standard" | "enhanced";

export type DocumentType =
  | "passport"
  | "national_id"
  | "residence_permit"
  | "proof_of_address"
  | "bank_statement"
  | "source_of_funds"
  | "source_of_wealth"
  | "company_registration"
  | "articles_of_association"
  | "shareholder_register"
  | "financial_statement"
  | "tax_return"
  | "other";

export type DocumentStatus =
  | "uploaded"
  | "processing"
  | "extracted"
  | "verified"
  | "rejected";

export type ScreeningType = "pep" | "sanctions" | "adverse_media";

export type ScreeningList = "un" | "eu" | "monaco" | "ofac" | "uk_hmt";

export type ActivityType =
  | "note"
  | "entity_created"
  | "entity_updated"
  | "relation_added"
  | "case_opened"
  | "case_status_changed"
  | "document_uploaded"
  | "document_verified"
  | "screening_completed"
  | "screening_match_found"
  | "risk_assessed"
  | "decision_made"
  | "review_requested"
  | "escalated";

export type CompanyType =
  | "sarl"
  | "sam"
  | "sci"
  | "scs"
  | "sa"
  | "trust"
  | "foundation"
  | "spv"
  | "other";

// --- Interfaces ---

export interface Entity {
  id: string;
  tenant_id: string;
  type: EntityType;
  display_name: string;
  status: EntityStatus;
  kyc_status: KycStatus;
  risk_score: number | null;
  risk_level: RiskLevel | null;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  attributes: Record<string, unknown>;
  tags: string[];
  source: string;
  created_at: string;
  updated_at: string;
}

export interface EntityPerson {
  entity_id: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  country_of_residence: string | null;
  is_pep: boolean;
  pep_details: Record<string, unknown> | null;
}

export interface EntityCompany {
  entity_id: string;
  legal_name: string | null;
  trading_name: string | null;
  registration_number: string | null;
  jurisdiction: string | null;
  incorporation_date: string | null;
  company_type: CompanyType | null;
  industry: string | null;
}

export interface EntityRelation {
  id: string;
  from_entity_id: string;
  to_entity_id: string;
  relation_type: RelationType;
  ownership_percentage: number | null;
  is_active: boolean;
}

export interface KycCase {
  id: string;
  tenant_id: string;
  entity_id: string;
  case_number: string;
  vigilance_level: VigilanceLevel;
  status: CaseStatus;
  decision_status: "approved" | "rejected" | "escalated" | null;
  decided_by: string | null;
  decided_at: string | null;
  decision_justification: string | null;
  ai_recommendation: "approve" | "reject" | "escalate" | null;
  ai_confidence: number | null;
  assigned_to: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Screening {
  id: string;
  entity_id: string;
  screening_type: ScreeningType;
  lists_checked: ScreeningList[];
  status: "pending" | "processing" | "completed" | "failed";
  match_found: boolean | null;
  matches: unknown[];
  review_decision: "confirmed_match" | "false_positive" | "pending" | null;
  created_at: string;
}

export interface Activity {
  id: string;
  entity_id: string;
  case_id: string | null;
  type: ActivityType;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  agent_id: string | null;
  created_at: string;
}
