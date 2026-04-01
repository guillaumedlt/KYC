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
  confidence: number;
  warnings: string[];
}> {
  const result = await callClaude(
    "extract",
    `Tu es un expert en extraction de documents d'identité internationaux. Tu lis TOUTES les langues : latin, arabe, cyrillique, chinois, japonais, coréen, hébreu, thaï, hindi, géorgien, arménien, etc.

LANGUES ET DOCUMENTS BILINGUES :
- Beaucoup de documents d'identité sont bilingues (ex: passeport marocain = arabe + français, passeport émirien = arabe + anglais, passeport chinois = chinois + anglais).
- Utilise la ZONE MRZ (Machine Readable Zone) en bas du document pour vérifier/confirmer les données extraites du texte visuel.
- Si le document a du texte en 2 langues, extrais les données de la version en CARACTÈRES LATINS quand disponible. Sinon, translittère en caractères latins.
- Pour les noms en arabe/chinois/cyrillique : utilise la translittération officielle visible sur le document (souvent dans le MRZ ou en 2ème langue). Ne translittère PAS toi-même si une version latine est déjà sur le doc.

RÈGLES D'EXTRACTION :
- firstName : TOUS les prénoms tels qu'écrits sur le document, séparés par des espaces. Exemple : "Mohammed Ahmed" ou "Jean Pierre Marie". Ne JAMAIS tronquer.
- lastName : Nom de famille COMPLET. Si le nom contient des particules (von, de, al-, bin, etc.), les inclure.
- dateOfBirth : Format JJ/MM/AAAA. Convertir depuis tout format (MM/DD/YYYY américain, YYYY/MM/DD asiatique, etc.).
- documentExpiry : Date d'expiration COMPLÈTE au format JJ/MM/AAAA. Si seuls mois/année visibles, mettre "01/MM/AAAA".
- nationality : Code ISO 2 lettres. Utilise le code du MRZ si disponible, sinon déduis du pays émetteur.
- documentLanguage : La ou les langues du document (ex: "ar+fr" pour arabe+français, "zh+en" pour chinois+anglais, "fr" pour français seul).
- Ne PAS inventer de données. Si illisible, mets null.

Réponds UNIQUEMENT en JSON :
{
  "firstName": "TOUS les prénoms en caractères latins",
  "lastName": "NOM COMPLET en caractères latins",
  "dateOfBirth": "JJ/MM/AAAA",
  "nationality": "CODE ISO 2 lettres",
  "documentNumber": "numéro exact du document",
  "documentExpiry": "JJ/MM/AAAA",
  "documentType": "passport|national_id|residence_permit|driving_license",
  "placeOfBirth": "ville/lieu de naissance en caractères latins",
  "gender": "M|F ou null",
  "documentLanguage": "codes langues séparés par + (ex: ar+fr)",
  "confidence": 0-100,
  "warnings": ["liste de problèmes"]
}

Warnings automatiques :
- Document expiré : "Document expiré depuis le JJ/MM/AAAA"
- Expire dans moins de 3 mois : "Document expire bientôt (JJ/MM/AAAA)"
- Qualité insuffisante : "Document de mauvaise qualité — certains champs illisibles"
- Incohérence MRZ : "Incohérence entre le MRZ et les données visuelles"
- Translittération incertaine : "Nom translittéré — vérifier l'orthographe"`,
    "Extrais toutes les informations de ce document d'identité. Le document peut être dans N'IMPORTE QUELLE LANGUE. Prends TOUS les prénoms. Utilise le MRZ si disponible.",
    imageBase64,
    mediaType,
  );

  try {
    return JSON.parse(result.text);
  } catch {
    return { firstName: null, lastName: null, dateOfBirth: null, nationality: null, documentNumber: null, documentExpiry: null, documentType: null, placeOfBirth: null, gender: null, documentLanguage: null, confidence: 0, warnings: ["Extraction échouée"] };
  }
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
  shareholders: { name: string; percentage: number; type: string }[];
  confidence: number;
  warnings: string[];
}> {
  const result = await callClaude(
    "extract",
    `Tu es un expert en extraction de documents de société internationaux. Tu lis TOUTES les langues.

DOCUMENT : ${docType}

EXTRACTION REQUISE — Réponds UNIQUEMENT en JSON :
{
  "companyName": "Raison sociale complète",
  "registrationNumber": "Numéro RCI, Kbis, Company Number, etc.",
  "jurisdiction": "CODE ISO 2 lettres du pays d'immatriculation",
  "companyType": "sam|sarl|sci|sa|sas|sca|snc|ltd|llc|gmbh|ag|bv|other",
  "capital": "Montant avec devise (ex: 500 000 EUR)",
  "registeredAddress": "Adresse COMPLÈTE du siège social telle qu'elle apparaît sur le document",
  "businessObject": "Objet social / activité de la société tel que décrit dans le document. Copier le texte exact si visible.",
  "persons": [
    {
      "name": "NOM Prénom(s) complet",
      "role": "Rôle EXACT tel qu'indiqué sur le document",
      "nationality": "CODE ISO 2 lettres si mentionnée"
    }
  ],
  "shareholders": [
    {
      "name": "Nom de l'actionnaire (personne ou société)",
      "percentage": 25,
      "type": "person|company"
    }
  ],
  "confidence": 0-100,
  "warnings": ["liste de problèmes"]
}

RÈGLES IMPORTANTES :

1. SIÈGE SOCIAL (registeredAddress) : Extrais l'adresse complète. Pour Monaco : numéro, rue, 98000 Monaco. Pour d'autres pays : adresse complète avec code postal et ville.

2. OBJET SOCIAL (businessObject) : Copie le texte de l'objet social tel qu'il apparaît. Si c'est un extrait RCI/Kbis, il y a souvent une rubrique "Activité" ou "Objet". Si c'est des statuts, cherche l'article sur l'objet social.

3. PERSONNES — Extrais TOUTES les personnes mentionnées avec leur RÔLE EXACT :
   Rôles courants à Monaco : "Administrateur Délégué", "Gérant", "Président", "Directeur Général", "Commissaire aux Comptes", "Associé Gérant", "Représentant Légal"
   Rôles France : "Président", "Directeur Général", "Gérant", "Commissaire aux Comptes"
   Rôles UK : "Director", "Secretary", "Person with Significant Control"
   Rôles US : "CEO", "President", "Secretary", "Registered Agent", "Member", "Manager"
   Rôles Suisse : "Administrateur", "Directeur", "Fondé de procuration"
   Rôles Luxembourg : "Gérant", "Administrateur", "Commissaire"
   → Ne PAS simplifier le rôle. Si le document dit "Administrateur Délégué", ne mets pas juste "Administrateur".

4. ACTIONNAIRES ET STRUCTURES COMPLEXES :
   - Extrais CHAQUE actionnaire avec son pourcentage et son type (personne physique ou morale).
   - Si un actionnaire est une SOCIÉTÉ (holding, SPV, etc.) : indique type="company" et le nom exact de la société.
   - Structures en cascade : Si Société A détient Société B qui détient la cible, extrais chaque niveau visible dans le document.
   - Holdings : Si le document mentionne une holding qui détient X%, note-la comme actionnaire type="company".
   - Trusts : Si un trust est actionnaire, note-le avec type="company" et précise "(Trust)" dans le nom.
   - Actions au porteur : Ajoute un warning "Actions au porteur détectées — identification UBO requise".
   - Nominee shareholders : Ajoute un warning "Actionnaire nominee détecté — identifier le bénéficiaire réel".
   - Si la chaîne de détention est complexe ou opaque, ajoute un warning "Structure de détention complexe — investigation complémentaire requise".

5. NE PAS extraire la date d'immatriculation.

6. MULTI-LANGUE : Le document peut être en n'importe quelle langue. Translittère les noms en caractères latins si nécessaire.`,
    `Extrais toutes les informations de ce document de société. Attention aux rôles exacts des personnes (Administrateur Délégué, Gérant, etc.), au siège social, et aux structures d'actionnariat complexes (holdings, sociétés en cascade, trusts).`,
    imageBase64,
  );

  try {
    return JSON.parse(result.text);
  } catch {
    return { companyName: null, registrationNumber: null, jurisdiction: null, companyType: null, capital: null, registeredAddress: null, businessObject: null, persons: [], shareholders: [], confidence: 0, warnings: ["Extraction échouée"] };
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
