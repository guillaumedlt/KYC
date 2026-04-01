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

// Lazy init — avoid reading env vars at module import time
let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY is not set in environment variables");
    _client = new Anthropic({ apiKey: key });
  }
  return _client;
}

type TaskType =
  | "classify"        // Haiku — what type of document is this?
  | "extract"         // Sonnet — OCR + structured extraction
  | "screen"          // Haiku — is this name a PEP/sanctions match?
  | "risk_assess"     // Sonnet — compute risk score from factors
  | "summarize"       // Haiku — summarize a document
  | "report"          // Sonnet — generate KYC report text
  | "complex_analysis"; // Opus — complex multi-step analysis

const MODEL_MAP: Record<TaskType, string> = {
  classify: "claude-sonnet-4-20250514",   // Sonnet for vision-based classification (reads the doc)
  extract: "claude-opus-4-20250514",      // Opus for best OCR accuracy on identity docs
  screen: "claude-haiku-4-5-20251001",
  risk_assess: "claude-sonnet-4-20250514",
  summarize: "claude-haiku-4-5-20251001",
  report: "claude-sonnet-4-20250514",
  complex_analysis: "claude-opus-4-20250514",
};

const MAX_TOKENS_MAP: Record<TaskType, number> = {
  classify: 200,
  extract: 2500,
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
  mediaType?: string,
): Promise<{ text: string; model: string; inputTokens: number; outputTokens: number }> {
  const model = MODEL_MAP[task];
  const maxTokens = MAX_TOKENS_MAP[task];

  // Detect media type from base64 header or parameter
  let detectedMediaType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf" = "image/jpeg";
  if (mediaType) {
    detectedMediaType = mediaType as typeof detectedMediaType;
  } else if (imageBase64) {
    if (imageBase64.startsWith("/9j/")) detectedMediaType = "image/jpeg";
    else if (imageBase64.startsWith("iVBOR")) detectedMediaType = "image/png";
    else if (imageBase64.startsWith("JVBER")) detectedMediaType = "application/pdf";
  }

  // For PDFs, use document type instead of image
  const isPdf = detectedMediaType === "application/pdf";

  const content: Anthropic.MessageCreateParams["messages"][0]["content"] = imageBase64
    ? isPdf
      ? [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: imageBase64 } },
          { type: "text", text: userMessage },
        ]
      : [
          { type: "image", source: { type: "base64", media_type: detectedMediaType as "image/jpeg" | "image/png" | "image/webp", data: imageBase64 } },
          { type: "text", text: userMessage },
        ]
    : userMessage;

  const response = await getClient().messages.create({
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

export async function classifyDocument(fileName: string, textContent?: string, imageBase64?: string, mediaType?: string): Promise<{
  type: string;
  label: string;
  confidence: number;
}> {
  const systemPrompt = `Tu analyses des documents pour les classifier précisément dans le cadre d'un processus KYC/AML.

Analyse le CONTENU du document (pas seulement le nom de fichier). Identifie exactement ce que c'est.

Réponds UNIQUEMENT en JSON :
{
  "type": "code_technique",
  "label": "Description lisible en français",
  "confidence": 0-100
}

Types possibles et leurs labels :
- "passport" → "Passeport"
- "national_id" → "Carte nationale d'identité"
- "residence_permit" → "Titre de séjour"
- "driving_license" → "Permis de conduire"
- "proof_of_address_electricity" → "Facture d'électricité"
- "proof_of_address_water" → "Facture d'eau"
- "proof_of_address_gas" → "Facture de gaz"
- "proof_of_address_telecom" → "Facture téléphone/internet"
- "proof_of_address_insurance" → "Attestation d'assurance habitation"
- "proof_of_address_tax" → "Avis d'imposition"
- "proof_of_address_rent" → "Quittance de loyer"
- "proof_of_address_bank" → "Relevé bancaire (justificatif domicile)"
- "proof_of_address_certificate" → "Attestation de résidence"
- "proof_of_address_other" → "Justificatif de domicile (autre)"
- "company_registration" → "Extrait RCI / Kbis / Certificate of incorporation"
- "articles_of_association" → "Statuts de société"
- "shareholder_register" → "Registre des actionnaires"
- "board_minutes" → "PV d'assemblée / Conseil d'administration"
- "power_of_attorney" → "Procuration / Pouvoir"
- "bank_statement" → "Relevé bancaire"
- "financial_statement" → "Bilan comptable / États financiers"
- "payslip" → "Fiche de paie / Bulletin de salaire"
- "tax_return" → "Déclaration fiscale"
- "sale_deed" → "Acte de vente"
- "inheritance_certificate" → "Certificat de succession / Acte notarié"
- "business_plan" → "Business plan"
- "invoice" → "Facture"
- "contract" → "Contrat"
- "certificate" → "Certificat / Attestation"
- "letter" → "Courrier / Lettre"
- "photo" → "Photo d'identité / Selfie"
- "other" → "Autre document"

Choisis le type le PLUS PRÉCIS possible. Par exemple, ne mets pas "proof_of_address" générique si tu peux identifier que c'est une facture EDF → "proof_of_address_electricity".`;

  const result = await callClaude(
    "classify",
    systemPrompt,
    `Nom du fichier: "${fileName}"${textContent ? `\nContenu textuel (extrait): ${textContent.slice(0, 500)}` : ""}\n\nAnalyse le contenu visuel du document et classifie-le précisément.`,
    imageBase64,
    mediaType,
  );

  try {
    return JSON.parse(result.text);
  } catch {
    return { type: "other", label: "Autre document", confidence: 0 };
  }
}

// =============================================================================
// IDENTITY EXTRACTION — Opus (best OCR, all languages)
// =============================================================================

export async function extractIdentity(imageBase64: string, mediaType?: string): Promise<{
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  documentNumber: string | null;
  documentExpiry: string | null;
  documentType: string | null;
  placeOfBirth: string | null;
  gender: string | null;
  documentLanguage: string | null;
  issuingCountry: string | null;
  confidence: number;
  warnings: string[];
}> {
  const systemPrompt = `Tu es un système OCR expert spécialisé dans l'extraction de documents d'identité officiels. Tu as été entraîné sur des millions de passeports, CNI, titres de séjour et permis de conduire du monde entier.

MÉTHODOLOGIE — suis ces étapes dans l'ordre :

ÉTAPE 1 — IDENTIFIER LE TYPE DE DOCUMENT
Regarde l'apparence générale : format, couleur, sécurité visible.
- Passeport : livret, page avec photo, MRZ en bas (2 lignes de 44 caractères ou 3 lignes de 30)
- CNI / Carte d'identité : format carte de crédit ou plus grand, recto parfois verso
- Titre de séjour : souvent format carte, mentions "titre de séjour" ou "residence permit"
- Permis de conduire : format carte, mentions "permis" ou "driving licence"

ÉTAPE 2 — LIRE LE MRZ (si présent)
Le MRZ (Machine Readable Zone) est la source la plus fiable. Structure :
- Ligne 1 : Type (P=passeport, I=ID) + Pays émetteur (3 lettres) + Nom<<Prénoms
- Ligne 2 : N° document + Nationalité + Date naissance (AAMMJJ) + Sexe + Date expiration (AAMMJJ)
Utilise le MRZ comme RÉFÉRENCE PRINCIPALE et compare avec le texte visuel.

ÉTAPE 3 — LIRE LES CHAMPS VISUELS
Lis chaque champ imprimé sur le document. Les labels courants :
- FR : Nom, Prénom(s), Né(e) le, Nationalité, N°, Date d'expiration, Sexe, Lieu de naissance
- EN : Surname, Given names, Date of birth, Nationality, Document No, Date of expiry, Sex, Place of birth
- Si bilingue, privilégie la version en caractères latins.

ÉTAPE 4 — CROSS-VÉRIFIER
Compare MRZ vs texte visuel. Si incohérence, signale-la en warning et privilégie le MRZ.

RÈGLES STRICTES :
1. firstName = TOUS les prénoms, séparés par des espaces. "Jean Pierre Marie" pas "Jean". Regarde le champ "Prénom(s)" ou "Given name(s)" — prends TOUT ce qui est écrit.
2. lastName = Nom de famille COMPLET avec particules (de, von, al-, bin, el-).
3. dateOfBirth = JJ/MM/AAAA. Le MRZ utilise AAMMJJ → convertis.
4. documentExpiry = JJ/MM/AAAA. Même conversion depuis le MRZ.
5. nationality = Code ISO 2 lettres (FR, GB, US...). Le MRZ utilise 3 lettres (FRA, GBR) → convertis en 2.
6. documentNumber = Le numéro EXACT. Souvent alphanumérique.
7. Si un champ est ILLISIBLE ou ABSENT → null. Ne JAMAIS inventer.

Réponds UNIQUEMENT avec ce JSON, rien d'autre :
{"firstName":"...","lastName":"...","dateOfBirth":"JJ/MM/AAAA","nationality":"XX","documentNumber":"...","documentExpiry":"JJ/MM/AAAA","documentType":"passport|national_id|residence_permit|driving_license","placeOfBirth":"...","gender":"M|F","documentLanguage":"xx+yy","issuingCountry":"XX","confidence":0,"warnings":[]}`;

  const userMessage = `Analyse ce document d'identité. Suis la méthodologie : 1) identifie le type, 2) lis le MRZ si présent, 3) lis les champs visuels, 4) cross-vérifie. Extrais TOUS les prénoms sans exception.`;

  // First attempt
  let result = await callClaude("extract", systemPrompt, userMessage, imageBase64, mediaType);

  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(result.text);
  } catch {
    // Retry once if JSON parse fails
    console.log("[Identity Extract] JSON parse failed, retrying...");
    result = await callClaude("extract", systemPrompt, userMessage + " IMPORTANT: ta réponse précédente n'était pas du JSON valide. Réponds UNIQUEMENT avec un objet JSON, sans texte autour.", imageBase64, mediaType);
    try {
      parsed = JSON.parse(result.text);
    } catch {
      console.error("[Identity Extract] Second attempt also failed");
    }
  }

  if (!parsed) {
    return { firstName: null, lastName: null, dateOfBirth: null, nationality: null, documentNumber: null, documentExpiry: null, documentType: null, placeOfBirth: null, gender: null, documentLanguage: null, issuingCountry: null, confidence: 0, warnings: ["Extraction échouée — le document n'a pas pu être lu"] };
  }

  // Post-processing: normalize data
  const data = parsed as Record<string, string | number | string[] | null>;

  // Normalize nationality from 3-letter to 2-letter ISO
  let nationality = data.nationality as string | null;
  if (nationality && nationality.length === 3) {
    const iso3to2: Record<string, string> = { FRA: "FR", GBR: "GB", USA: "US", DEU: "DE", ITA: "IT", ESP: "ES", CHE: "CH", MCO: "MC", RUS: "RU", CHN: "CN", JPN: "JP", MAR: "MA", TUN: "TN", DZA: "DZ", LBN: "LB", ARE: "AE", SAU: "SA", BRA: "BR", PRT: "PT", BEL: "BE", NLD: "NL", LUX: "LU", AUT: "AT", POL: "PL", ROU: "RO", UKR: "UA", TUR: "TR", IND: "IN", PAK: "PK", BGD: "BD", EGY: "EG", GRC: "GR", SRB: "RS", HRV: "HR", BGR: "BG", HUN: "HU", CZE: "CZ", SWE: "SE", NOR: "NO", DNK: "DK", FIN: "FI", IRL: "IE", ISR: "IL", ARG: "AR", COL: "CO", PER: "PE", CHL: "CL", MEX: "MX", CAN: "CA", AUS: "AU", NZL: "NZ", ZAF: "ZA", NGA: "NG", KEN: "KE", GHA: "GH", SEN: "SN", CIV: "CI", CMR: "CM", COD: "CD", AGO: "AO", MOZ: "MZ", MDG: "MG" };
    nationality = iso3to2[nationality] ?? nationality.slice(0, 2);
  }

  // Build warnings
  const warnings: string[] = Array.isArray(data.warnings) ? data.warnings as string[] : [];

  // Check expiry
  const expiry = data.documentExpiry as string | null;
  if (expiry && /^\d{2}\/\d{2}\/\d{4}$/.test(expiry)) {
    const [d, m, y] = expiry.split("/").map(Number);
    const expiryDate = new Date(y, m - 1, d);
    const now = new Date();
    const threeMonths = new Date(now.getTime() + 90 * 86400000);
    if (expiryDate < now && !warnings.some((w) => w.includes("expiré"))) {
      warnings.push(`Document expiré depuis le ${expiry}`);
    } else if (expiryDate < threeMonths && !warnings.some((w) => w.includes("expire"))) {
      warnings.push(`Document expire bientôt (${expiry})`);
    }
  }

  return {
    firstName: (data.firstName as string) || null,
    lastName: (data.lastName as string) || null,
    dateOfBirth: (data.dateOfBirth as string) || null,
    nationality,
    documentNumber: (data.documentNumber as string) || null,
    documentExpiry: expiry || null,
    documentType: (data.documentType as string) || null,
    placeOfBirth: (data.placeOfBirth as string) || null,
    gender: (data.gender as string) || null,
    documentLanguage: (data.documentLanguage as string) || null,
    issuingCountry: (data.issuingCountry as string) || nationality || null,
    confidence: typeof data.confidence === "number" ? data.confidence : 0,
    warnings,
  };
}

// =============================================================================
// ADDRESS EXTRACTION — Sonnet
// =============================================================================

export async function extractAddress(imageBase64: string, mediaType?: string, clientContext?: { firstName?: string; lastName?: string; nationality?: string }): Promise<{
  address: string | null;
  documentType: string | null;
  documentDate: string | null;
  nameOnDocument: string | null;
  isRecent: boolean;
  nameMatch: boolean;
  confidence: number;
  warnings: string[];
}> {
  const clientInfo = clientContext
    ? `\n\nCONTEXTE CLIENT (identité déjà vérifiée) :\n- Nom: ${clientContext.lastName ?? "inconnu"}\n- Prénom(s): ${clientContext.firstName ?? "inconnu"}\n- Nationalité: ${clientContext.nationality ?? "inconnue"}\n\nVÉRIFICATION OBLIGATOIRE : Compare le nom sur ce document avec l'identité du client ci-dessus. Si le nom ne correspond PAS (même partiellement), mets nameMatch à false et ajoute un warning.`
    : "";

  const result = await callClaude(
    "extract",
    `Tu extrais l'adresse d'un justificatif de domicile et tu vérifies la cohérence avec l'identité du client.${clientInfo}

Réponds UNIQUEMENT en JSON:
{
  "address": "adresse complète",
  "documentType": "utility_bill_electricity|utility_bill_water|utility_bill_gas|telecom_bill|bank_statement|tax_notice|insurance_certificate|rent_receipt|residence_certificate|other",
  "documentDate": "JJ/MM/AAAA",
  "nameOnDocument": "nom tel qu'il apparaît sur le document",
  "isRecent": true si le document date de moins de 3 mois par rapport à aujourd'hui,
  "nameMatch": true si le nom sur le document correspond au client (même partiellement — nom de famille suffit),
  "confidence": 0-100,
  "warnings": ["liste de problèmes"]
}

Warnings automatiques :
- Document de plus de 3 mois : "Document daté de plus de 3 mois (JJ/MM/AAAA)"
- Nom différent du client : "Le nom sur le document (XXX) ne correspond pas au client (YYY)"
- Document illisible : "Document de mauvaise qualité"
- Pas un justificatif de domicile : "Ce document ne semble pas être un justificatif de domicile"`,
    "Extrais l'adresse, vérifie que le nom sur le document correspond au client, et vérifie la date.",
    imageBase64,
    mediaType,
  );

  try {
    return JSON.parse(result.text);
  } catch {
    return { address: null, documentType: null, documentDate: null, nameOnDocument: null, isRecent: false, nameMatch: true, confidence: 0, warnings: ["Extraction échouée"] };
  }
}

// =============================================================================
// COMPANY EXTRACTION — Opus (best accuracy, all languages)
// =============================================================================

export async function extractCompanyDocument(imageBase64: string, docType: string): Promise<{
  companyName: string | null;
  registrationNumber: string | null;
  jurisdiction: string | null;
  companyType: string | null;
  capital: string | null;
  registeredAddress: string | null;
  businessObject: string | null;
  persons: { name: string; role: string; nationality?: string }[];
  shareholders: { name: string; percentage: number; type: string; jurisdiction?: string; registrationNumber?: string; heldThrough?: string; subsidiaries?: { name: string; percentage: number; type: string }[] }[];
  ownershipChain: string | null;
  confidence: number;
  warnings: string[];
}> {
  const result = await callClaude(
    "extract",
    `Tu es un expert compliance spécialisé dans l'extraction de documents de société et l'analyse de structures capitalistiques complexes.

DOCUMENT : ${docType}

Réponds UNIQUEMENT en JSON :
{
  "companyName": "Raison sociale complète",
  "registrationNumber": "N° RCI/Kbis/Company Number",
  "jurisdiction": "CODE ISO 2 lettres",
  "companyType": "sam|sarl|sci|sa|sas|sca|snc|ltd|llc|gmbh|ag|bv|other",
  "capital": "Montant avec devise",
  "registeredAddress": "Adresse COMPLÈTE du siège social",
  "businessObject": "Objet social tel que dans le document",
  "persons": [
    {"name": "NOM Prénom(s)", "role": "Rôle EXACT du document", "nationality": "XX"}
  ],
  "shareholders": [
    {
      "name": "Nom actionnaire",
      "percentage": 65,
      "type": "person|company|trust|foundation",
      "jurisdiction": "XX si société étrangère",
      "registrationNumber": "numéro si visible",
      "heldThrough": "nom de l'intermédiaire si détention indirecte",
      "subsidiaries": [
        {"name": "sous-actionnaire si visible", "percentage": 100, "type": "person|company"}
      ]
    }
  ],
  "ownershipChain": "Description textuelle de la chaîne de détention si complexe. Ex: 'M. Dupont (100%) → Holding Alpha SA (65%) → Société Cible SAM'",
  "confidence": 0-100,
  "warnings": []
}

RÈGLES ACTIONNARIAT — C'EST CRITIQUE :

1. POURCENTAGES : Extrais le % EXACT de chaque actionnaire. Si le document dit "parts sociales" ou "actions", calcule le % à partir du nombre de parts vs capital total. Si un actionnaire a 650 parts sur 1000, c'est 65%.

2. TYPE D'ACTIONNAIRE :
   - "person" : Personne physique (M. Dupont, Mme Martin)
   - "company" : Société (Holding XYZ SA, Riviera Invest LLC)
   - "trust" : Trust, fiducie (The Moretti Family Trust)
   - "foundation" : Fondation (Fondation ABC)

3. STRUCTURES EN CASCADE / HOLDINGS :
   Si le document montre une chaîne de détention :
   Exemple : "Holding Alpha SA (Luxembourg) détient 65% → détenue à 100% par M. Jean Dupont"
   → shareholders: [{"name": "Holding Alpha SA", "percentage": 65, "type": "company", "jurisdiction": "LU", "subsidiaries": [{"name": "Jean DUPONT", "percentage": 100, "type": "person"}]}]
   → ownershipChain: "Jean DUPONT (100%) → Holding Alpha SA [LU] (65%) → [Société Cible]"

4. DÉTENTION INDIRECTE :
   Si M. X détient via une société intermédiaire, renseigne "heldThrough".
   Exemple : M. X détient 30% via SCI Patrimoine
   → {"name": "M. X", "percentage": 30, "type": "person", "heldThrough": "SCI Patrimoine"}

5. CAS SPÉCIAUX — ajouter un warning :
   - Actions au porteur → "Actions au porteur détectées — UBO non identifiable"
   - Nominee/prête-nom → "Actionnaire nominee — identifier le bénéficiaire réel"
   - Trust opaque → "Trust sans bénéficiaire identifié — investigation requise"
   - Juridiction à risque → "Actionnaire dans une juridiction à risque (XXX)"
   - % qui ne totalisent pas 100% → "Total actionnariat = XX% — parts manquantes"
   - Démembrement (usufruit/nue-propriété) → "Démembrement de propriété détecté"

6. PERSONNES — rôle EXACT tel que sur le document (Administrateur Délégué, pas Administrateur).

7. SIÈGE SOCIAL — adresse complète.

8. OBJET SOCIAL — texte exact du document.

9. NE PAS extraire la date d'immatriculation.`,
    `Extrais toutes les informations. SURTOUT l'actionnariat avec les % exacts, les structures de holding/cascade, et les rôles exacts des personnes.`,
    imageBase64,
  );

  try {
    return JSON.parse(result.text);
  } catch {
    return { companyName: null, registrationNumber: null, jurisdiction: null, companyType: null, capital: null, registeredAddress: null, businessObject: null, persons: [], shareholders: [], ownershipChain: null, confidence: 0, warnings: ["Extraction échouée"] };
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

export async function extractFundsSource(imageBase64: string, mediaType?: string, clientContext?: { firstName?: string; lastName?: string; nationality?: string }): Promise<{
  sourceType: string;
  amount: string | null;
  employer: string | null;
  period: string | null;
  nameOnDocument: string | null;
  nameMatch: boolean;
  confidence: number;
  warnings: string[];
}> {
  const clientInfo = clientContext
    ? `\n\nCONTEXTE CLIENT (identité déjà vérifiée) :\n- Nom: ${clientContext.lastName ?? "inconnu"}\n- Prénom(s): ${clientContext.firstName ?? "inconnu"}\n- Nationalité: ${clientContext.nationality ?? "inconnue"}\n\nVÉRIFICATION OBLIGATOIRE :\n1. Vérifie que le nom sur ce document correspond au client. Si non → nameMatch = false + warning.\n2. Vérifie que ce document est bien un justificatif de source de fonds (pas un document sans rapport).\n3. Vérifie la cohérence entre le montant et le type de source déclaré.`
    : "";

  const result = await callClaude(
    "extract",
    `Tu extrais les informations d'un justificatif de source de fonds ET tu vérifies la cohérence avec l'identité du client.${clientInfo}

Types de source :
- salary : Fiche de paie, bulletin de salaire, attestation employeur
- real_estate : Acte de vente immobilière, attestation notaire
- inheritance : Acte de succession, certificat d'héritage, donation
- investment : Relevé de portefeuille, avis d'opéré, plus-value
- business : Bilan, liasse fiscale, revenus d'activité
- pension : Pension de retraite, rente
- rental_income : Revenus locatifs, quittances
- insurance : Rachat d'assurance-vie, indemnité
- loan : Contrat de prêt
- other : Autre source

Réponds UNIQUEMENT en JSON:
{
  "sourceType": "salary|real_estate|inheritance|investment|business|pension|rental_income|insurance|loan|other",
  "amount": "montant avec devise (ex: 4 500 EUR)",
  "employer": "nom de l'employeur, du notaire, de la banque, ou de la source",
  "period": "période couverte (ex: Mars 2026, Année 2025, etc.)",
  "nameOnDocument": "nom de la personne tel qu'il apparaît sur le document",
  "nameMatch": true si le nom correspond au client,
  "confidence": 0-100,
  "warnings": ["liste de problèmes"]
}

Warnings automatiques :
- Nom différent : "Le nom sur le document (XXX) ne correspond pas au client (YYY)"
- Document sans rapport : "Ce document ne semble pas être un justificatif de source de fonds"
- Montant incohérent : "Montant inhabituellement élevé/faible pour ce type de source"
- Document ancien : "Document daté de plus de 12 mois"`,
    "Extrais les informations de source de fonds. Vérifie que le nom correspond au client.",
    imageBase64,
    mediaType,
  );

  try {
    return JSON.parse(result.text);
  } catch {
    return { sourceType: "other", amount: null, employer: null, period: null, nameOnDocument: null, nameMatch: true, confidence: 0, warnings: ["Extraction échouée"] };
  }
}
