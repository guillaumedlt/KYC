import Anthropic from "@anthropic-ai/sdk";

// =============================================================================
// CLAUDE SERVICE — Credit-optimized
//
// Model strategy (cost per 1M tokens input/output):
// - Haiku 4.5:   $0.80 / $4    → classification, simple extraction, yes/no
// - Sonnet 4.6:  $3   / $15    → document OCR, screening analysis, summaries
// - Opus 4.6:    $15  / $75    → complex risk assessment, report generation
//
// Rule: ALWAYS use the cheapest model that can do the job.
// =============================================================================

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type TaskType =
  | "classify"        // Haiku — what type of document is this?
  | "extract"         // Sonnet — OCR + structured extraction
  | "screen"          // Haiku — is this name a PEP/sanctions match?
  | "risk_assess"     // Sonnet — compute risk score from factors
  | "summarize"       // Haiku — summarize a document
  | "report"          // Sonnet — generate KYC report text
  | "complex_analysis"; // Opus — complex multi-step analysis

const MODEL_MAP: Record<TaskType, string> = {
  classify: "claude-haiku-4-5-20251001",
  extract: "claude-sonnet-4-20250514",
  screen: "claude-haiku-4-5-20251001",
  risk_assess: "claude-sonnet-4-20250514",
  summarize: "claude-haiku-4-5-20251001",
  report: "claude-sonnet-4-20250514",
  complex_analysis: "claude-opus-4-20250514",
};

const MAX_TOKENS_MAP: Record<TaskType, number> = {
  classify: 200,
  extract: 1500,
  screen: 300,
  risk_assess: 1000,
  summarize: 500,
  report: 2000,
  complex_analysis: 3000,
};

// =============================================================================
// CORE CALL — minimized tokens, structured output
// =============================================================================

export async function callClaude(
  task: TaskType,
  systemPrompt: string,
  userMessage: string,
  imageBase64?: string,
): Promise<{ text: string; model: string; inputTokens: number; outputTokens: number }> {
  const model = MODEL_MAP[task];
  const maxTokens = MAX_TOKENS_MAP[task];

  const content: Anthropic.MessageCreateParams["messages"][0]["content"] = imageBase64
    ? [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
        { type: "text", text: userMessage },
      ]
    : userMessage;

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content }],
  });

  const rawText = response.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("");

  // Extract JSON from response (Claude sometimes wraps in ```json ... ```)
  const text = extractJson(rawText);

  return {
    text,
    model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

/** Extract JSON from a Claude response that may contain markdown code blocks */
function extractJson(text: string): string {
  // Try to find JSON in code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  return text;
}

// =============================================================================
// DOCUMENT CLASSIFICATION — Haiku (cheapest)
// =============================================================================

export async function classifyDocument(fileName: string, textContent?: string): Promise<{
  type: "passport" | "national_id" | "proof_of_address" | "company_registration" | "articles_of_association" | "bank_statement" | "financial_statement" | "other";
  confidence: number;
}> {
  const result = await callClaude(
    "classify",
    "Tu classifies des documents KYC. Réponds UNIQUEMENT en JSON: {\"type\": \"...\", \"confidence\": 0-100}. Types possibles: passport, national_id, proof_of_address, company_registration, articles_of_association, bank_statement, financial_statement, other.",
    `Fichier: "${fileName}"${textContent ? `\nContenu (extrait): ${textContent.slice(0, 500)}` : ""}`,
  );

  try {
    return JSON.parse(result.text);
  } catch {
    return { type: "other", confidence: 0 };
  }
}

// =============================================================================
// IDENTITY EXTRACTION — Sonnet (vision capable)
// =============================================================================

export async function extractIdentity(imageBase64: string): Promise<{
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  documentNumber: string | null;
  documentExpiry: string | null;
  documentType: string | null;
  countryOfResidence: string | null;
  confidence: number;
  warnings: string[];
}> {
  const result = await callClaude(
    "extract",
    `Tu extrais les informations d'un document d'identité (passeport, CNI, titre de séjour).
Réponds UNIQUEMENT en JSON avec ces champs:
{
  "firstName": "...",
  "lastName": "...",
  "dateOfBirth": "JJ/MM/AAAA",
  "nationality": "CODE ISO 2 lettres",
  "documentNumber": "...",
  "documentExpiry": "MM/AAAA",
  "documentType": "passport|national_id|residence_permit",
  "countryOfResidence": "CODE ISO 2 lettres ou null",
  "confidence": 0-100,
  "warnings": ["liste de problèmes détectés"]
}
Si un champ n'est pas lisible, mets null. Ajoute un warning si le document expire dans moins de 3 mois.`,
    "Extrais toutes les informations de ce document d'identité.",
    imageBase64,
  );

  try {
    return JSON.parse(result.text);
  } catch {
    return { firstName: null, lastName: null, dateOfBirth: null, nationality: null, documentNumber: null, documentExpiry: null, documentType: null, countryOfResidence: null, confidence: 0, warnings: ["Extraction échouée"] };
  }
}

// =============================================================================
// ADDRESS EXTRACTION — Sonnet
// =============================================================================

export async function extractAddress(imageBase64: string): Promise<{
  address: string | null;
  documentType: string | null;
  documentDate: string | null;
  isRecent: boolean;
  confidence: number;
  warnings: string[];
}> {
  const result = await callClaude(
    "extract",
    `Tu extrais l'adresse d'un justificatif de domicile.
Réponds UNIQUEMENT en JSON:
{
  "address": "adresse complète",
  "documentType": "utility_bill|bank_statement|tax_notice|residence_certificate|other",
  "documentDate": "JJ/MM/AAAA",
  "isRecent": true si < 3 mois,
  "confidence": 0-100,
  "warnings": []
}`,
    "Extrais l'adresse et la date de ce justificatif de domicile.",
    imageBase64,
  );

  try {
    return JSON.parse(result.text);
  } catch {
    return { address: null, documentType: null, documentDate: null, isRecent: false, confidence: 0, warnings: ["Extraction échouée"] };
  }
}

// =============================================================================
// COMPANY EXTRACTION — Sonnet
// =============================================================================

export async function extractCompanyDocument(imageBase64: string, docType: string): Promise<{
  companyName: string | null;
  registrationNumber: string | null;
  jurisdiction: string | null;
  incorporationDate: string | null;
  companyType: string | null;
  capital: string | null;
  directors: string[];
  shareholders: { name: string; percentage: number }[];
  confidence: number;
}> {
  const result = await callClaude(
    "extract",
    `Tu extrais les informations d'un document de société (${docType}).
Réponds UNIQUEMENT en JSON:
{
  "companyName": "...",
  "registrationNumber": "...",
  "jurisdiction": "CODE ISO 2 lettres",
  "incorporationDate": "JJ/MM/AAAA",
  "companyType": "sam|sarl|sci|sa|sas|ltd|llc|other",
  "capital": "montant avec devise",
  "directors": ["nom1", "nom2"],
  "shareholders": [{"name": "...", "percentage": 25}],
  "confidence": 0-100
}`,
    `Extrais les informations de ce document de société (${docType}).`,
    imageBase64,
  );

  try {
    return JSON.parse(result.text);
  } catch {
    return { companyName: null, registrationNumber: null, jurisdiction: null, incorporationDate: null, companyType: null, capital: null, directors: [], shareholders: [], confidence: 0 };
  }
}

// =============================================================================
// PEP/SANCTIONS SCREENING — Haiku (fast + cheap)
// =============================================================================

export async function screenName(name: string, nationality: string | null): Promise<{
  pepMatch: boolean;
  pepDetails: string | null;
  sanctionsRisk: "none" | "low" | "medium" | "high";
  adverseMedia: string | null;
  confidence: number;
}> {
  const result = await callClaude(
    "screen",
    `Tu es un analyste compliance. Évalue si cette personne est potentiellement un PEP (Personne Politiquement Exposée) ou présente un risque sanctions.
Réponds UNIQUEMENT en JSON:
{
  "pepMatch": true/false,
  "pepDetails": "description de la fonction si PEP, sinon null",
  "sanctionsRisk": "none|low|medium|high",
  "adverseMedia": "résumé si trouvé, sinon null",
  "confidence": 0-100
}
NOTE: Tu n'as pas accès aux bases de données PEP/sanctions en temps réel. Base-toi sur tes connaissances.`,
    `Personne: ${name}${nationality ? ` (nationalité: ${nationality})` : ""}`,
  );

  try {
    return JSON.parse(result.text);
  } catch {
    return { pepMatch: false, pepDetails: null, sanctionsRisk: "none", adverseMedia: null, confidence: 0 };
  }
}

// =============================================================================
// FUNDS SOURCE EXTRACTION — Sonnet
// =============================================================================

export async function extractFundsSource(imageBase64: string): Promise<{
  sourceType: string;
  amount: string | null;
  employer: string | null;
  period: string | null;
  confidence: number;
}> {
  const result = await callClaude(
    "extract",
    `Tu extrais les informations d'un justificatif de source de fonds (fiche de paie, acte de vente, relevé, etc.).
Réponds UNIQUEMENT en JSON:
{
  "sourceType": "salary|real_estate|inheritance|investment|business|other",
  "amount": "montant avec devise",
  "employer": "nom de l'employeur ou source si applicable",
  "period": "période couverte",
  "confidence": 0-100
}`,
    "Extrais les informations de source de fonds de ce document.",
    imageBase64,
  );

  try {
    return JSON.parse(result.text);
  } catch {
    return { sourceType: "other", amount: null, employer: null, period: null, confidence: 0 };
  }
}
