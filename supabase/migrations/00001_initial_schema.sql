-- KYC Monaco — Initial Schema
-- Entity Graph + KYC Cases + Audit Trail

-- =============================================================================
-- TENANTS
-- =============================================================================
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type text not null check (type in (
    'bank', 'fiduciary', 'law_firm', 'accounting', 'real_estate',
    'insurance', 'wealth_management', 'other'
  )),
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- USERS
-- =============================================================================
create table users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  auth_id text unique,
  email text not null,
  full_name text not null,
  role text not null default 'analyst' check (role in (
    'admin', 'compliance_officer', 'analyst', 'viewer'
  )),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_users_tenant on users(tenant_id);
create index idx_users_auth_id on users(auth_id);

-- =============================================================================
-- ENTITIES
-- =============================================================================
create table entities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  type text not null check (type in (
    'person', 'company', 'trust', 'foundation', 'spv', 'fund'
  )),
  display_name text not null,
  status text not null default 'active' check (status in (
    'active', 'inactive', 'archived'
  )),
  kyc_status text not null default 'not_started' check (kyc_status in (
    'not_started', 'in_progress', 'pending_review', 'approved', 'rejected', 'expired'
  )),
  risk_score integer check (risk_score >= 0 and risk_score <= 100),
  risk_level text check (risk_level in ('low', 'medium', 'high', 'critical')),
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  attributes jsonb not null default '{}',
  tags text[] not null default '{}',
  source text not null default 'manual' check (source in (
    'manual', 'api', 'import', 'screening'
  )),
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_entities_tenant on entities(tenant_id);
create index idx_entities_type on entities(tenant_id, type);
create index idx_entities_kyc_status on entities(tenant_id, kyc_status);
create index idx_entities_risk_level on entities(tenant_id, risk_level);
create index idx_entities_display_name on entities(tenant_id, display_name);

-- =============================================================================
-- ENTITY_PEOPLE
-- =============================================================================
create table entity_people (
  entity_id uuid primary key references entities(id) on delete cascade,
  tenant_id uuid not null references tenants(id),
  first_name text,
  last_name text,
  date_of_birth text,
  nationality text,
  country_of_residence text,
  address text,
  phone text,
  email text,
  profession text,
  passport_number text,
  national_id text,
  tax_id text,
  is_pep boolean not null default false,
  pep_details jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_entity_people_tenant on entity_people(tenant_id);

-- =============================================================================
-- ENTITY_COMPANIES
-- =============================================================================
create table entity_companies (
  entity_id uuid primary key references entities(id) on delete cascade,
  tenant_id uuid not null references tenants(id),
  legal_name text,
  trading_name text,
  registration_number text,
  jurisdiction text,
  incorporation_date date,
  company_type text check (company_type in (
    'sarl', 'sam', 'sci', 'scs', 'sa', 'trust', 'foundation', 'spv', 'other'
  )),
  industry text,
  address text,
  phone text,
  email text,
  website text,
  capital text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_entity_companies_tenant on entity_companies(tenant_id);

-- =============================================================================
-- ENTITY_RELATIONS
-- =============================================================================
create table entity_relations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  from_entity_id uuid not null references entities(id) on delete cascade,
  to_entity_id uuid not null references entities(id) on delete cascade,
  relation_type text not null check (relation_type in (
    'ubo', 'shareholder', 'director', 'officer', 'trustee', 'beneficiary',
    'settlor', 'protector', 'nominee', 'family_spouse', 'family_child',
    'family_parent', 'associate', 'authorized_signatory', 'legal_representative'
  )),
  ownership_percentage numeric(5,2) check (
    ownership_percentage is null or (ownership_percentage >= 0 and ownership_percentage <= 100)
  ),
  start_date date,
  end_date date,
  is_active boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(tenant_id, from_entity_id, to_entity_id, relation_type)
);

create index idx_relations_tenant on entity_relations(tenant_id);
create index idx_relations_from on entity_relations(from_entity_id);
create index idx_relations_to on entity_relations(to_entity_id);

-- =============================================================================
-- KYC_CASES
-- =============================================================================
create table kyc_cases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  entity_id uuid not null references entities(id),
  case_number text not null,
  vigilance_level text not null default 'standard' check (vigilance_level in (
    'simplified', 'standard', 'enhanced'
  )),
  status text not null default 'open' check (status in (
    'open', 'documents_pending', 'screening', 'risk_review',
    'pending_decision', 'approved', 'rejected', 'escalated', 'closed'
  )),
  purpose text,
  expected_activity text,
  source_of_funds text,
  source_of_wealth text,
  decision_status text check (decision_status in ('approved', 'rejected', 'escalated')),
  decided_by uuid references users(id),
  decided_at timestamptz,
  decision_justification text,
  ai_recommendation text check (ai_recommendation in ('approve', 'reject', 'escalate')),
  ai_confidence integer check (ai_confidence >= 0 and ai_confidence <= 100),
  ai_reasoning text,
  assigned_to uuid references users(id),
  due_date date,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_cases_tenant on kyc_cases(tenant_id);
create index idx_cases_entity on kyc_cases(entity_id);
create index idx_cases_status on kyc_cases(tenant_id, status);
create unique index idx_cases_number on kyc_cases(tenant_id, case_number);

-- =============================================================================
-- DOCUMENTS
-- =============================================================================
create table documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  entity_id uuid not null references entities(id),
  case_id uuid references kyc_cases(id),
  name text not null,
  type text not null check (type in (
    'passport', 'national_id', 'residence_permit', 'proof_of_address',
    'bank_statement', 'source_of_funds', 'source_of_wealth',
    'company_registration', 'articles_of_association', 'shareholder_register',
    'financial_statement', 'tax_return', 'other'
  )),
  status text not null default 'uploaded' check (status in (
    'uploaded', 'processing', 'extracted', 'verified', 'rejected'
  )),
  storage_path text not null,
  file_size integer,
  mime_type text,
  extracted_data jsonb,
  extraction_confidence integer check (extraction_confidence >= 0 and extraction_confidence <= 100),
  verified_by text check (verified_by in ('ai_agent', 'human_reviewer')),
  verified_at timestamptz,
  uploaded_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_documents_tenant on documents(tenant_id);
create index idx_documents_entity on documents(entity_id);
create index idx_documents_case on documents(case_id);

-- =============================================================================
-- SCREENINGS
-- =============================================================================
create table screenings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  entity_id uuid not null references entities(id),
  screening_type text not null check (screening_type in (
    'pep', 'sanctions', 'adverse_media'
  )),
  lists_checked text[] not null default '{}',
  status text not null default 'pending' check (status in (
    'pending', 'processing', 'completed', 'failed'
  )),
  match_found boolean,
  matches jsonb not null default '[]',
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  review_decision text check (review_decision in ('confirmed_match', 'false_positive', 'pending')),
  review_notes text,
  created_at timestamptz not null default now()
);

create index idx_screenings_tenant on screenings(tenant_id);
create index idx_screenings_entity on screenings(entity_id);

-- =============================================================================
-- ACTIVITIES
-- =============================================================================
create table activities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  entity_id uuid not null references entities(id),
  case_id uuid references kyc_cases(id),
  type text not null check (type in (
    'note', 'entity_created', 'entity_updated', 'relation_added',
    'case_opened', 'case_status_changed', 'document_uploaded',
    'document_verified', 'screening_completed', 'screening_match_found',
    'risk_assessed', 'decision_made', 'review_requested', 'escalated'
  )),
  title text not null,
  description text,
  metadata jsonb not null default '{}',
  created_by uuid references users(id),
  agent_id text,
  created_at timestamptz not null default now()
);

create index idx_activities_tenant on activities(tenant_id);
create index idx_activities_entity on activities(entity_id, created_at desc);
create index idx_activities_case on activities(case_id);

-- =============================================================================
-- AUDIT_LOGS (immutable)
-- =============================================================================
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  user_id uuid references users(id),
  agent_id text,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  before_state jsonb,
  after_state jsonb,
  ip_address inet,
  user_agent text,
  checksum text not null,
  created_at timestamptz not null default now()
);

create index idx_audit_tenant on audit_logs(tenant_id, created_at desc);
create index idx_audit_resource on audit_logs(resource_type, resource_id);

-- =============================================================================
-- RLS — enabled on all tables, open policies for dev (will be tightened later)
-- =============================================================================
alter table tenants enable row level security;
alter table users enable row level security;
alter table entities enable row level security;
alter table entity_people enable row level security;
alter table entity_companies enable row level security;
alter table entity_relations enable row level security;
alter table kyc_cases enable row level security;
alter table documents enable row level security;
alter table screenings enable row level security;
alter table activities enable row level security;
alter table audit_logs enable row level security;

-- Dev policies — allow all for anon/authenticated (will be replaced by tenant-scoped policies)
create policy "allow_all_tenants" on tenants for all using (true) with check (true);
create policy "allow_all_users" on users for all using (true) with check (true);
create policy "allow_all_entities" on entities for all using (true) with check (true);
create policy "allow_all_entity_people" on entity_people for all using (true) with check (true);
create policy "allow_all_entity_companies" on entity_companies for all using (true) with check (true);
create policy "allow_all_entity_relations" on entity_relations for all using (true) with check (true);
create policy "allow_all_kyc_cases" on kyc_cases for all using (true) with check (true);
create policy "allow_all_documents" on documents for all using (true) with check (true);
create policy "allow_all_screenings" on screenings for all using (true) with check (true);
create policy "allow_all_activities" on activities for all using (true) with check (true);
create policy "allow_all_audit_logs" on audit_logs for all using (true) with check (true);

-- =============================================================================
-- TRIGGERS
-- =============================================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_tenants_updated_at before update on tenants for each row execute function update_updated_at();
create trigger trg_users_updated_at before update on users for each row execute function update_updated_at();
create trigger trg_entities_updated_at before update on entities for each row execute function update_updated_at();
create trigger trg_entity_people_updated_at before update on entity_people for each row execute function update_updated_at();
create trigger trg_entity_companies_updated_at before update on entity_companies for each row execute function update_updated_at();
create trigger trg_kyc_cases_updated_at before update on kyc_cases for each row execute function update_updated_at();
create trigger trg_documents_updated_at before update on documents for each row execute function update_updated_at();

-- Audit logs: immutable (append-only)
create or replace function prevent_audit_delete()
returns trigger as $$
begin
  raise exception 'Audit logs cannot be deleted (compliance requirement)';
end;
$$ language plpgsql;

create trigger trg_audit_no_delete before delete on audit_logs for each row execute function prevent_audit_delete();

create or replace function prevent_audit_update()
returns trigger as $$
begin
  raise exception 'Audit logs cannot be updated (compliance requirement)';
end;
$$ language plpgsql;

create trigger trg_audit_no_update before update on audit_logs for each row execute function prevent_audit_update();

-- =============================================================================
-- SEED: demo tenant + demo data
-- =============================================================================
insert into tenants (id, name, slug, type) values
  ('00000000-0000-0000-0000-000000000001', 'Cabinet Dupont & Associés', 'dupont', 'law_firm');

insert into entities (id, tenant_id, type, display_name, kyc_status, risk_score, risk_level, tags, source) values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'person', 'Jean-Pierre Moretti', 'in_progress', 72, 'high', '{pep,monaco-resident}', 'manual'),
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'person', 'Elena Vasquez', 'approved', 28, 'low', '{}', 'manual'),
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 'company', 'Monaco Trading SAM', 'pending_review', 58, 'medium', '{high-value}', 'manual'),
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', 'company', 'Riviera Wealth SCI', 'approved', 15, 'low', '{}', 'manual'),
  ('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000001', 'person', 'Dmitri Volkov', 'pending_review', 85, 'critical', '{sanctions-match,high-risk-country}', 'manual');

insert into entity_people (entity_id, tenant_id, first_name, last_name, date_of_birth, nationality, country_of_residence, address, phone, email, profession, is_pep, pep_details) values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Jean-Pierre', 'Moretti', '***1965', 'MC', 'MC', '27 Boulevard Albert 1er, 98000 Monaco', '***4512', 'jp.moretti@example.mc', 'Conseiller National / Investisseur', true, '{"position": "Conseiller National", "since": "2019"}'),
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'Elena', 'Vasquez', '***1988', 'IT', 'MC', '3 Rue Grimaldi, 98000 Monaco', '***7834', 'e.vasquez@example.mc', 'Directrice générale', false, null),
  ('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000001', 'Dmitri', 'Volkov', '***1970', 'RU', 'MC', '15 Avenue de la Costa, 98000 Monaco', '***9021', null, 'Investisseur', false, null);

insert into entity_companies (entity_id, tenant_id, legal_name, trading_name, registration_number, jurisdiction, incorporation_date, company_type, industry, address, phone, email, website, capital) values
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 'Monaco Trading SAM', 'Monaco Trading', 'RC 2018B03421', 'MC', '2018-06-12', 'sam', 'Trading & Commodities', '7 Avenue de Grande Bretagne, 98000 Monaco', '***8800', 'contact@monacotrading.mc', 'www.monacotrading.mc', '500 000 €'),
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', 'Riviera Wealth SCI', null, 'RC 2020B05678', 'MC', '2020-03-22', 'sci', 'Real Estate', '12 Boulevard des Moulins, 98000 Monaco', null, 'admin@rivierawealth.mc', null, '150 000 €');

insert into entity_relations (id, tenant_id, from_entity_id, to_entity_id, relation_type, ownership_percentage) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000030', 'ubo', 65),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000030', 'director', null),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000040', 'shareholder', 100),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000030', 'shareholder', 20);
