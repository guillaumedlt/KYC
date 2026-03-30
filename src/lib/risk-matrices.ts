// =============================================================================
// RISK MATRIX ENGINE
// A matrix defines: which factors to evaluate, their weights, and thresholds
// =============================================================================

export interface RiskFactor {
  id: string;
  category: "client" | "geographic" | "product" | "channel" | "structure";
  name: string;
  description: string;
  weight: number; // 0-30
  conditions: string[]; // When this factor applies
}

export interface VigilanceThreshold {
  level: "simplified" | "standard" | "enhanced" | "prohibited";
  minScore: number;
  maxScore: number;
  label: string;
  reviewFrequency: string;
  requiredDocs: string[];
  color: string;
}

export interface RiskMatrix {
  id: string;
  name: string;
  description: string;
  icon: string;
  isPreset: boolean; // preset by system vs custom
  entityTypes: ("person" | "company" | "trust" | "foundation")[];
  factors: RiskFactor[];
  thresholds: VigilanceThreshold[];
  createdAt: string;
}

// =============================================================================
// STANDARD THRESHOLDS (shared across matrices, customizable per matrix)
// =============================================================================

const STANDARD_THRESHOLDS: VigilanceThreshold[] = [
  { level: "simplified", minScore: 0, maxScore: 25, label: "Simplifiée", reviewFrequency: "Tous les 3 ans", requiredDocs: ["identity_document"], color: "emerald" },
  { level: "standard", minScore: 26, maxScore: 59, label: "Standard", reviewFrequency: "Annuelle", requiredDocs: ["identity_document", "proof_of_address", "source_of_funds"], color: "blue" },
  { level: "enhanced", minScore: 60, maxScore: 79, label: "Renforcée", reviewFrequency: "Semestrielle", requiredDocs: ["identity_document", "proof_of_address", "source_of_funds", "source_of_wealth", "bank_reference"], color: "orange" },
  { level: "prohibited", minScore: 80, maxScore: 100, label: "Interdite", reviewFrequency: "Rejet", requiredDocs: [], color: "red" },
];

// =============================================================================
// PRESET MATRICES
// =============================================================================

export const PRESET_MATRICES: RiskMatrix[] = [
  {
    id: "matrix-immobilier",
    name: "Immobilier",
    description: "Transactions immobilières, SCI, promotion — focus sur l'origine des fonds et les structures opaques",
    icon: "🏠",
    isPreset: true,
    entityTypes: ["person", "company"],
    factors: [
      { id: "f1", category: "client", name: "PEP", description: "Personne Politiquement Exposée", weight: 25, conditions: ["PEP détecté par screening"] },
      { id: "f2", category: "client", name: "PEP famille/associé", description: "Proche d'un PEP", weight: 15, conditions: ["Relation familiale ou business avec PEP"] },
      { id: "f3", category: "product", name: "Transaction > 1M€", description: "Montant élevé pour l'immobilier", weight: 15, conditions: ["Prix d'achat ou investissement > 1 000 000 €"] },
      { id: "f4", category: "product", name: "Paiement cash/crypto", description: "Mode de paiement à risque", weight: 20, conditions: ["Paiement en espèces ou crypto-actifs"] },
      { id: "f5", category: "structure", name: "SCI multi-couches", description: "Structures imbriquées", weight: 15, conditions: ["Plus de 2 niveaux de sociétés entre le bien et l'UBO"] },
      { id: "f6", category: "geographic", name: "Pays à risque GAFI", description: "Nationalité ou résidence en zone noire", weight: 25, conditions: ["Pays sur la liste noire ou grise GAFI"] },
      { id: "f7", category: "geographic", name: "Paradis fiscal", description: "Juridiction à fiscalité privilégiée", weight: 10, conditions: ["Société dans une juridiction listée"] },
      { id: "f8", category: "client", name: "Adverse media", description: "Mentions médias défavorables", weight: 20, conditions: ["Articles de presse négatifs détectés"] },
      { id: "f9", category: "channel", name: "Non face-à-face", description: "Relation à distance", weight: 5, conditions: ["Pas de rencontre physique"] },
      { id: "f10", category: "product", name: "Revente rapide", description: "Bien revendu < 2 ans", weight: 10, conditions: ["Revente dans les 24 mois suivant l'achat"] },
    ],
    thresholds: STANDARD_THRESHOLDS,
    createdAt: "2026-01-01",
  },
  {
    id: "matrix-creation-societe",
    name: "Création de société",
    description: "Constitution de sociétés monégasques — focus sur l'UBO, la structure et l'objet social",
    icon: "🏢",
    isPreset: true,
    entityTypes: ["company", "trust", "foundation"],
    factors: [
      { id: "f1", category: "client", name: "UBO PEP", description: "Bénéficiaire effectif PEP", weight: 25, conditions: ["Un UBO est PEP"] },
      { id: "f2", category: "structure", name: "Structure complexe", description: "Plus de 2 niveaux de détention", weight: 20, conditions: ["Chaîne de détention > 2 niveaux"] },
      { id: "f3", category: "structure", name: "Nominee/prête-nom", description: "Actionnaire ou dirigeant nominee", weight: 15, conditions: ["Présence d'un nominee dans la structure"] },
      { id: "f4", category: "structure", name: "Actions au porteur", description: "Parts non nominatives", weight: 20, conditions: ["La société émet des actions au porteur"] },
      { id: "f5", category: "geographic", name: "Juridiction opaque", description: "Entité dans la chaîne enregistrée dans une juridiction opaque", weight: 20, conditions: ["BVI, Panama, Seychelles, etc."] },
      { id: "f6", category: "geographic", name: "Pays à risque", description: "UBO résident d'un pays à risque", weight: 25, conditions: ["Pays liste noire/grise GAFI"] },
      { id: "f7", category: "product", name: "Capital < 15k€", description: "Capital anormalement bas", weight: 5, conditions: ["Capital social < 15 000 €"] },
      { id: "f8", category: "product", name: "Objet social large", description: "Activité non précisée", weight: 10, conditions: ["Objet social trop générique"] },
      { id: "f9", category: "client", name: "Adverse media", description: "Mentions défavorables sur les UBO/dirigeants", weight: 20, conditions: ["Articles négatifs détectés"] },
      { id: "f10", category: "client", name: "Sanctions match", description: "Match sur listes de gel", weight: 30, conditions: ["Match confirmé ONU/UE/OFAC"] },
    ],
    thresholds: STANDARD_THRESHOLDS,
    createdAt: "2026-01-01",
  },
  {
    id: "matrix-wealth-management",
    name: "Gestion de patrimoine",
    description: "Family offices, gestion d'actifs — focus sur la source de fortune et les mouvements cross-border",
    icon: "💰",
    isPreset: true,
    entityTypes: ["person", "company", "trust", "foundation"],
    factors: [
      { id: "f1", category: "client", name: "PEP", description: "Personne Politiquement Exposée", weight: 25, conditions: ["PEP détecté"] },
      { id: "f2", category: "client", name: "Source de fortune opaque", description: "Incapacité à justifier l'origine de la fortune", weight: 25, conditions: ["Documentation insuffisante"] },
      { id: "f3", category: "product", name: "Actifs > 5M€", description: "Patrimoine géré important", weight: 10, conditions: ["AUM > 5 000 000 €"] },
      { id: "f4", category: "product", name: "Transferts cross-border fréquents", description: "Mouvements internationaux réguliers", weight: 15, conditions: ["> 3 transferts/mois vers des pays différents"] },
      { id: "f5", category: "geographic", name: "Multi-juridictions", description: "Actifs dans 3+ juridictions", weight: 10, conditions: ["Patrimoine réparti dans 3+ pays"] },
      { id: "f6", category: "geographic", name: "Pays à risque", description: "Origine des fonds d'un pays à risque", weight: 25, conditions: ["Pays GAFI liste noire/grise"] },
      { id: "f7", category: "structure", name: "Trust discrétionnaire", description: "Trust sans bénéficiaires définis", weight: 20, conditions: ["Bénéficiaires à la discrétion du trustee"] },
      { id: "f8", category: "client", name: "Adverse media", description: "Couverture médiatique négative", weight: 20, conditions: ["Articles détectés"] },
      { id: "f9", category: "client", name: "Sanctions match", description: "Match listes de gel", weight: 30, conditions: ["Match confirmé"] },
      { id: "f10", category: "channel", name: "Intermédiaire tiers", description: "Introduction par un tiers", weight: 5, conditions: ["Client introduit par un apporteur d'affaires"] },
    ],
    thresholds: STANDARD_THRESHOLDS,
    createdAt: "2026-01-01",
  },
  {
    id: "matrix-banque",
    name: "Banque / Compte courant",
    description: "Ouverture de comptes, opérations bancaires — scoring standard AMSF",
    icon: "🏦",
    isPreset: true,
    entityTypes: ["person", "company"],
    factors: [
      { id: "f1", category: "client", name: "PEP", description: "Personne Politiquement Exposée", weight: 25, conditions: ["PEP détecté"] },
      { id: "f2", category: "client", name: "Sanctions match", description: "Match listes de gel", weight: 30, conditions: ["Match confirmé"] },
      { id: "f3", category: "client", name: "Adverse media", description: "Couverture négative", weight: 20, conditions: ["Articles détectés"] },
      { id: "f4", category: "geographic", name: "Pays à risque", description: "Nationalité/résidence zone GAFI", weight: 25, conditions: ["Liste noire/grise"] },
      { id: "f5", category: "product", name: "Cash intensive", description: "Activité intensive en espèces", weight: 15, conditions: ["Dépôts cash réguliers"] },
      { id: "f6", category: "product", name: "Crypto-actifs", description: "Activité liée aux cryptos", weight: 10, conditions: ["Transactions crypto détectées"] },
      { id: "f7", category: "channel", name: "Non face-à-face", description: "Ouverture à distance", weight: 5, conditions: ["Pas de rencontre physique"] },
      { id: "f8", category: "structure", name: "Compte pour tiers", description: "Compte ouvert pour un tiers", weight: 15, conditions: ["Le titulaire agit pour le compte d'un tiers"] },
    ],
    thresholds: STANDARD_THRESHOLDS,
    createdAt: "2026-01-01",
  },
  {
    id: "matrix-trust-fondation",
    name: "Trust & Fondation",
    description: "Structures fiduciaires complexes — vigilance renforcée systématique",
    icon: "⚖️",
    isPreset: true,
    entityTypes: ["trust", "foundation"],
    factors: [
      { id: "f1", category: "structure", name: "Bénéficiaires non définis", description: "Classe de bénéficiaires discrétionnaire", weight: 25, conditions: ["Pas de bénéficiaires nommés"] },
      { id: "f2", category: "structure", name: "Settlor PEP", description: "Le constituant est PEP", weight: 25, conditions: ["PEP détecté"] },
      { id: "f3", category: "structure", name: "Protecteur offshore", description: "Protector dans une juridiction opaque", weight: 15, conditions: ["Protector enregistré BVI/Panama/etc."] },
      { id: "f4", category: "geographic", name: "Juridiction du trust", description: "Trust enregistré dans un pays à risque", weight: 20, conditions: ["Juridiction GAFI liste noire/grise"] },
      { id: "f5", category: "product", name: "Actifs > 10M€", description: "Patrimoine très important", weight: 10, conditions: ["Actifs > 10M€"] },
      { id: "f6", category: "client", name: "Sanctions match", description: "Match sur listes de gel", weight: 30, conditions: ["Match confirmé"] },
      { id: "f7", category: "client", name: "Adverse media", description: "Couverture négative", weight: 20, conditions: ["Articles détectés"] },
      { id: "f8", category: "structure", name: "Clause de fuite", description: "Clause permettant le changement de juridiction", weight: 10, conditions: ["Flight clause détectée dans les statuts"] },
    ],
    thresholds: [
      { level: "standard", minScore: 0, maxScore: 39, label: "Standard (vigilance min. renforcée)", reviewFrequency: "Annuelle", requiredDocs: ["identity_document", "proof_of_address", "source_of_funds", "trust_deed"], color: "blue" },
      { level: "enhanced", minScore: 40, maxScore: 69, label: "Renforcée", reviewFrequency: "Semestrielle", requiredDocs: ["identity_document", "proof_of_address", "source_of_funds", "source_of_wealth", "trust_deed", "letter_of_wishes"], color: "orange" },
      { level: "prohibited", minScore: 70, maxScore: 100, label: "Interdite", reviewFrequency: "Rejet", requiredDocs: [], color: "red" },
    ],
    createdAt: "2026-01-01",
  },
];

// =============================================================================
// Helper: compute risk score from a matrix
// =============================================================================

export function computeRiskScore(
  matrix: RiskMatrix,
  activeFactorIds: string[],
): { score: number; level: string; factors: { name: string; weight: number }[] } {
  const activeFactors = matrix.factors.filter((f) => activeFactorIds.includes(f.id));
  const score = Math.min(100, activeFactors.reduce((sum, f) => sum + f.weight, 0));
  const threshold = matrix.thresholds.find((t) => score >= t.minScore && score <= t.maxScore);
  return {
    score,
    level: threshold?.level ?? "standard",
    factors: activeFactors.map((f) => ({ name: f.name, weight: f.weight })),
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  client: "Client",
  geographic: "Géographique",
  product: "Produit / Activité",
  channel: "Canal",
  structure: "Structure",
};

export { CATEGORY_LABELS };
