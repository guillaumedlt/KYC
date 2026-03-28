import type {
  Entity,
  EntityPerson,
  EntityCompany,
  EntityRelation,
  KycCase,
  Activity,
  Screening,
  ScreeningList,
} from "@/types";

// =============================================================================
// Entities
// =============================================================================

export const MOCK_PEOPLE: (Entity & { person: EntityPerson })[] = [
  {
    id: "e1",
    tenant_id: "t1",
    type: "person",
    display_name: "Jean-Pierre Moretti",
    status: "active",
    kyc_status: "in_progress",
    risk_score: 72,
    risk_level: "high",
    last_reviewed_at: null,
    next_review_at: "2026-06-15",
    attributes: {},
    tags: ["pep", "monaco-resident"],
    source: "manual",
    created_at: "2026-03-20T10:00:00Z",
    updated_at: "2026-03-25T14:30:00Z",
    person: {
      entity_id: "e1",
      first_name: "Jean-Pierre",
      last_name: "Moretti",
      date_of_birth: "***1965",
      nationality: "FR",
      country_of_residence: "MC",
      is_pep: true,
      pep_details: { position: "Conseiller National", since: "2019" },
    },
  },
  {
    id: "e2",
    tenant_id: "t1",
    type: "person",
    display_name: "Elena Vasquez",
    status: "active",
    kyc_status: "approved",
    risk_score: 28,
    risk_level: "low",
    last_reviewed_at: "2026-01-10T09:00:00Z",
    next_review_at: "2029-01-10",
    attributes: {},
    tags: [],
    source: "manual",
    created_at: "2026-01-05T08:00:00Z",
    updated_at: "2026-01-10T09:00:00Z",
    person: {
      entity_id: "e2",
      first_name: "Elena",
      last_name: "Vasquez",
      date_of_birth: "***1988",
      nationality: "ES",
      country_of_residence: "MC",
      is_pep: false,
      pep_details: null,
    },
  },
  {
    id: "e5",
    tenant_id: "t1",
    type: "person",
    display_name: "Dmitri Volkov",
    status: "active",
    kyc_status: "pending_review",
    risk_score: 85,
    risk_level: "critical",
    last_reviewed_at: null,
    next_review_at: "2026-04-01",
    attributes: {},
    tags: ["sanctions-match", "high-risk-country"],
    source: "manual",
    created_at: "2026-03-15T09:00:00Z",
    updated_at: "2026-03-27T11:00:00Z",
    person: {
      entity_id: "e5",
      first_name: "Dmitri",
      last_name: "Volkov",
      date_of_birth: "***1970",
      nationality: "RU",
      country_of_residence: "MC",
      is_pep: false,
      pep_details: null,
    },
  },
];

export const MOCK_COMPANIES: (Entity & { company: EntityCompany })[] = [
  {
    id: "e3",
    tenant_id: "t1",
    type: "company",
    display_name: "Monaco Trading SAM",
    status: "active",
    kyc_status: "pending_review",
    risk_score: 58,
    risk_level: "medium",
    last_reviewed_at: null,
    next_review_at: "2026-09-01",
    attributes: {},
    tags: ["high-value"],
    source: "manual",
    created_at: "2026-02-15T11:00:00Z",
    updated_at: "2026-03-20T16:00:00Z",
    company: {
      entity_id: "e3",
      legal_name: "Monaco Trading SAM",
      trading_name: "Monaco Trading",
      registration_number: "RC 2018B03421",
      jurisdiction: "MC",
      incorporation_date: "2018-06-12",
      company_type: "sam",
      industry: "Trading & Commodities",
    },
  },
  {
    id: "e4",
    tenant_id: "t1",
    type: "company",
    display_name: "Riviera Wealth SCI",
    status: "active",
    kyc_status: "approved",
    risk_score: 15,
    risk_level: "low",
    last_reviewed_at: "2026-02-01T10:00:00Z",
    next_review_at: "2027-02-01",
    attributes: {},
    tags: [],
    source: "manual",
    created_at: "2025-12-01T09:00:00Z",
    updated_at: "2026-02-01T10:00:00Z",
    company: {
      entity_id: "e4",
      legal_name: "Riviera Wealth SCI",
      trading_name: null,
      registration_number: "RC 2020B05678",
      jurisdiction: "MC",
      incorporation_date: "2020-03-22",
      company_type: "sci",
      industry: "Real Estate",
    },
  },
];

export const MOCK_ENTITIES = [...MOCK_PEOPLE, ...MOCK_COMPANIES];

// =============================================================================
// Relations
// =============================================================================

export const MOCK_RELATIONS: EntityRelation[] = [
  { id: "r1", from_entity_id: "e1", to_entity_id: "e3", relation_type: "ubo", ownership_percentage: 65, is_active: true },
  { id: "r2", from_entity_id: "e2", to_entity_id: "e3", relation_type: "director", ownership_percentage: null, is_active: true },
  { id: "r3", from_entity_id: "e1", to_entity_id: "e4", relation_type: "shareholder", ownership_percentage: 100, is_active: true },
  { id: "r4", from_entity_id: "e5", to_entity_id: "e3", relation_type: "shareholder", ownership_percentage: 20, is_active: true },
];

// =============================================================================
// KYC Cases
// =============================================================================

export const MOCK_CASES: KycCase[] = [
  {
    id: "c1", tenant_id: "t1", entity_id: "e1", case_number: "KYC-2026-0001",
    vigilance_level: "enhanced", status: "screening",
    decision_status: null, decided_by: null, decided_at: null, decision_justification: null,
    ai_recommendation: "escalate", ai_confidence: 78,
    assigned_to: null, due_date: "2026-04-15",
    created_at: "2026-03-20T10:00:00Z", updated_at: "2026-03-25T14:30:00Z",
  },
  {
    id: "c2", tenant_id: "t1", entity_id: "e3", case_number: "KYC-2026-0002",
    vigilance_level: "standard", status: "documents_pending",
    decision_status: null, decided_by: null, decided_at: null, decision_justification: null,
    ai_recommendation: null, ai_confidence: null,
    assigned_to: null, due_date: "2026-04-30",
    created_at: "2026-03-22T11:00:00Z", updated_at: "2026-03-22T11:00:00Z",
  },
  {
    id: "c3", tenant_id: "t1", entity_id: "e2", case_number: "KYC-2026-0003",
    vigilance_level: "simplified", status: "approved",
    decision_status: "approved", decided_by: "u1", decided_at: "2026-01-10T09:00:00Z",
    decision_justification: "Low risk profile, all documents verified, no PEP/sanctions match.",
    ai_recommendation: "approve", ai_confidence: 95,
    assigned_to: null, due_date: null,
    created_at: "2026-01-05T08:00:00Z", updated_at: "2026-01-10T09:00:00Z",
  },
  {
    id: "c4", tenant_id: "t1", entity_id: "e5", case_number: "KYC-2026-0004",
    vigilance_level: "enhanced", status: "risk_review",
    decision_status: null, decided_by: null, decided_at: null, decision_justification: null,
    ai_recommendation: "reject", ai_confidence: 91,
    assigned_to: null, due_date: "2026-04-01",
    created_at: "2026-03-15T09:00:00Z", updated_at: "2026-03-27T11:00:00Z",
  },
];

// =============================================================================
// Screenings
// =============================================================================

export const MOCK_SCREENINGS: Screening[] = [
  {
    id: "s1", entity_id: "e1", screening_type: "pep",
    lists_checked: ["un", "eu", "monaco"] as ScreeningList[],
    status: "completed", match_found: true,
    matches: [{ name: "Jean-Pierre Moretti", position: "Conseiller National de Monaco", source: "Monaco PEP List", confidence: 97 }],
    review_decision: "confirmed_match", created_at: "2026-03-25T14:00:00Z",
  },
  {
    id: "s2", entity_id: "e1", screening_type: "sanctions",
    lists_checked: ["un", "eu", "monaco", "ofac"] as ScreeningList[],
    status: "completed", match_found: false, matches: [],
    review_decision: null, created_at: "2026-03-25T14:05:00Z",
  },
  {
    id: "s3", entity_id: "e5", screening_type: "sanctions",
    lists_checked: ["un", "eu", "monaco", "ofac", "uk_hmt"] as ScreeningList[],
    status: "completed", match_found: true,
    matches: [{ name: "Dmitri V. Volkov", list: "EU Consolidated Sanctions", reference: "EU-2024-1234", confidence: 82 }],
    review_decision: "pending", created_at: "2026-03-27T10:00:00Z",
  },
  {
    id: "s4", entity_id: "e5", screening_type: "adverse_media",
    lists_checked: [] as ScreeningList[],
    status: "completed", match_found: true,
    matches: [{ source: "Reuters", title: "Monaco authorities investigate Russian nationals", date: "2025-11-15", relevance: 74 }],
    review_decision: "pending", created_at: "2026-03-27T10:30:00Z",
  },
  {
    id: "s5", entity_id: "e2", screening_type: "pep",
    lists_checked: ["un", "eu", "monaco"] as ScreeningList[],
    status: "completed", match_found: false, matches: [],
    review_decision: null, created_at: "2026-01-06T10:00:00Z",
  },
  {
    id: "s6", entity_id: "e2", screening_type: "sanctions",
    lists_checked: ["un", "eu", "monaco", "ofac"] as ScreeningList[],
    status: "completed", match_found: false, matches: [],
    review_decision: null, created_at: "2026-01-06T10:05:00Z",
  },
  {
    id: "s7", entity_id: "e3", screening_type: "sanctions",
    lists_checked: ["un", "eu", "monaco", "ofac"] as ScreeningList[],
    status: "processing", match_found: null, matches: [],
    review_decision: null, created_at: "2026-03-28T08:00:00Z",
  },
];

// =============================================================================
// Activities
// =============================================================================

export const MOCK_ACTIVITIES: Activity[] = [
  { id: "a0", entity_id: "e5", case_id: "c4", type: "screening_match_found", title: "Sanctions match — revue requise", description: "Dmitri Volkov — EU Consolidated Sanctions (confiance 82%)", metadata: {}, created_by: null, agent_id: "screening-agent", created_at: "2026-03-27T10:00:00Z" },
  { id: "a1", entity_id: "e1", case_id: "c1", type: "screening_match_found", title: "PEP match trouvé", description: "Jean-Pierre Moretti — Conseiller National de Monaco", metadata: {}, created_by: null, agent_id: "screening-agent", created_at: "2026-03-25T14:30:00Z" },
  { id: "a2", entity_id: "e1", case_id: "c1", type: "case_opened", title: "Dossier KYC ouvert", description: "Vigilance renforcée — PEP détecté", metadata: {}, created_by: "u1", agent_id: null, created_at: "2026-03-20T10:00:00Z" },
  { id: "a3", entity_id: "e3", case_id: "c2", type: "entity_created", title: "Entité créée", description: "Monaco Trading SAM ajoutée au système", metadata: {}, created_by: "u1", agent_id: null, created_at: "2026-02-15T11:00:00Z" },
  { id: "a4", entity_id: "e2", case_id: "c3", type: "decision_made", title: "Dossier approuvé", description: "Low risk, all checks passed", metadata: {}, created_by: "u1", agent_id: null, created_at: "2026-01-10T09:00:00Z" },
];

// =============================================================================
// Risk factors (for risk breakdown view)
// =============================================================================

export interface RiskFactor {
  category: string;
  factor: string;
  impact: number;
  details: string;
}

export const MOCK_RISK_FACTORS: Record<string, RiskFactor[]> = {
  e1: [
    { category: "Client", factor: "PEP", impact: 25, details: "Conseiller National de Monaco" },
    { category: "Géographique", factor: "Liste grise GAFI", impact: 15, details: "Monaco (sous surveillance)" },
    { category: "Structure", factor: "UBO multi-sociétés", impact: 15, details: "UBO de Monaco Trading SAM (65%) + Riviera Wealth SCI (100%)" },
    { category: "Activité", factor: "Trading commodities", impact: 10, details: "Secteur à risque via Monaco Trading SAM" },
    { category: "Canal", factor: "Non face-à-face", impact: 5, details: "Relation établie sans rencontre physique" },
  ],
  e2: [
    { category: "Client", factor: "Profil standard", impact: 0, details: "Aucun facteur de risque identifié" },
    { category: "Géographique", factor: "UE", impact: 5, details: "Nationalité espagnole, résident Monaco" },
    { category: "Activité", factor: "Immobilier", impact: 10, details: "Directrice de Monaco Trading SAM" },
  ],
  e3: [
    { category: "Client", factor: "UBO PEP", impact: 20, details: "UBO Jean-Pierre Moretti est PEP" },
    { category: "Géographique", factor: "Liste grise GAFI", impact: 15, details: "Juridiction Monaco" },
    { category: "Structure", factor: "Actionnaire russe", impact: 15, details: "Dmitri Volkov (20%), sanctions match pending" },
    { category: "Activité", factor: "Trading commodities", impact: 10, details: "Secteur à risque LCB-FT" },
  ],
  e5: [
    { category: "Client", factor: "Sanctions match", impact: 30, details: "Match EU Consolidated Sanctions (confiance 82%)" },
    { category: "Géographique", factor: "Pays à risque", impact: 25, details: "Nationalité russe — pays sous sanctions" },
    { category: "Média", factor: "Adverse media", impact: 20, details: "Mentions Reuters concernant enquête Monaco" },
    { category: "Structure", factor: "Actionnaire", impact: 10, details: "20% de Monaco Trading SAM" },
  ],
};

// =============================================================================
// Helpers
// =============================================================================

export function getEntityById(id: string) {
  return MOCK_ENTITIES.find((e) => e.id === id);
}

export function getRelationsForEntity(entityId: string) {
  return MOCK_RELATIONS.filter(
    (r) => r.from_entity_id === entityId || r.to_entity_id === entityId,
  );
}

export function getCasesForEntity(entityId: string) {
  return MOCK_CASES.filter((c) => c.entity_id === entityId);
}

export function getActivitiesForEntity(entityId: string) {
  return MOCK_ACTIVITIES.filter((a) => a.entity_id === entityId).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function getScreeningsForEntity(entityId: string) {
  return MOCK_SCREENINGS.filter((s) => s.entity_id === entityId).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function getRiskFactors(entityId: string) {
  return MOCK_RISK_FACTORS[entityId] ?? [];
}
