// =============================================================================
// RISK MATRIX ENGINE — Conformity AMSF / SICCFIN
// Qualitative 3-level system: Faible / Moyen / Élevé
// Based on 5 mandatory risk factors per AMSF guidelines (Loi 1.362)
// =============================================================================

export type RiskLevel = "faible" | "moyen" | "eleve";

export type VigilanceLevel = "simplifiee" | "standard" | "renforcee";

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  faible: "Faible",
  moyen: "Moyen",
  eleve: "Élevé",
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, { bg: string; text: string; border: string; dot: string }> = {
  faible: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  moyen: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  eleve: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
};

export const VIGILANCE_LABELS: Record<VigilanceLevel, string> = {
  simplifiee: "Simplifiée",
  standard: "Standard",
  renforcee: "Renforcée",
};

export const VIGILANCE_COLORS: Record<VigilanceLevel, { bg: string; text: string; border: string }> = {
  simplifiee: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  standard: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  renforcee: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
};

// =============================================================================
// The 5 mandatory AMSF risk factor IDs
// =============================================================================

export const AMSF_FACTOR_IDS = [
  "produits_services",
  "conditions_transactions",
  "canaux_distribution",
  "caracteristiques_clientele",
  "pays_zones_geographiques",
] as const;

export type AmsfFactorId = (typeof AMSF_FACTOR_IDS)[number];

export const AMSF_FACTOR_DEFINITIONS: Record<AmsfFactorId, { name: string; description: string; examples: Record<RiskLevel, string[]> }> = {
  produits_services: {
    name: "Nature des produits/services",
    description: "Évaluation du risque inhérent aux produits et services proposés dans le cadre de la relation d'affaires.",
    examples: {
      faible: [
        "Produits simples et transparents",
        "Services standardisés avec peu de personnalisation",
        "Opérations de faible montant et récurrentes",
      ],
      moyen: [
        "Produits comportant un degré de complexité modéré",
        "Services impliquant des montants significatifs",
        "Opérations ponctuelles de montant intermédiaire",
      ],
      eleve: [
        "Produits complexes ou opaques (private equity, structuration)",
        "Services facilitant l'anonymat ou le transfert rapide de valeur",
        "Crypto-actifs, actions au porteur, instruments non régulés",
      ],
    },
  },
  conditions_transactions: {
    name: "Conditions de transactions",
    description: "Analyse des modalités de paiement, montants, fréquence et complexité des transactions envisagées.",
    examples: {
      faible: [
        "Virements bancaires classiques depuis des établissements régulés",
        "Montants cohérents avec le profil économique du client",
        "Transactions simples et traçables",
      ],
      moyen: [
        "Montants significatifs mais justifiés",
        "Paiements fractionnés ou en plusieurs devises",
        "Transactions transfrontalières occasionnelles",
      ],
      eleve: [
        "Paiements en espèces ou crypto-actifs",
        "Montants disproportionnés par rapport au profil",
        "Transactions complexes, multi-étapes, sans justification économique claire",
      ],
    },
  },
  canaux_distribution: {
    name: "Canaux de distribution",
    description: "Évaluation du mode d'entrée en relation et des intermédiaires impliqués dans la relation d'affaires.",
    examples: {
      faible: [
        "Relation en face-à-face avec identification physique",
        "Client introduit par un professionnel assujetti et régulé",
        "Canal direct sans intermédiaire",
      ],
      moyen: [
        "Relation partiellement à distance avec vérification renforcée",
        "Intermédiaire connu mais non assujetti",
        "Introduction par un tiers de confiance",
      ],
      eleve: [
        "Relation entièrement à distance sans rencontre physique",
        "Intermédiaire non identifié ou dans une juridiction opaque",
        "Utilisation de structures écran ou de prête-noms",
      ],
    },
  },
  caracteristiques_clientele: {
    name: "Caractéristiques de la clientèle",
    description: "Profil du client : statut PEP, secteur d'activité, réputation, comportement et cohérence économique.",
    examples: {
      faible: [
        "Client résident monégasque avec activité stable et transparente",
        "Aucun statut PEP, pas de sanctions, pas d'adverse media",
        "Profil économique cohérent et documenté",
      ],
      moyen: [
        "Client non-résident d'un pays à risque modéré",
        "PEP de second rang (famille, associé proche)",
        "Secteur d'activité sensible (immobilier, négoce, art)",
      ],
      eleve: [
        "PEP de premier rang ou ses proches directs",
        "Client figurant sur des listes de sanctions ou adverse media",
        "Comportement incohérent, réticence à fournir des informations",
        "Activité dans des secteurs à haut risque BC/FT",
      ],
    },
  },
  pays_zones_geographiques: {
    name: "Pays et zones géographiques",
    description: "Risque lié à la nationalité, résidence, ou aux juridictions impliquées (listes GAFI, UE, SICCFIN).",
    examples: {
      faible: [
        "Monaco, France, UE/EEE (hors pays à risque)",
        "Pays avec un dispositif LCB-FT jugé équivalent",
        "Aucune connexion avec des juridictions à risque",
      ],
      moyen: [
        "Pays sous surveillance renforcée du GAFI (liste grise)",
        "Juridictions à fiscalité privilégiée (sans opacité avérée)",
        "Connexions indirectes avec des zones sensibles",
      ],
      eleve: [
        "Pays sur la liste noire du GAFI ou sous sanctions UE/ONU",
        "Juridictions opaques (BVI, Panama, Seychelles)",
        "Pays identifiés par le SICCFIN comme présentant un risque élevé",
      ],
    },
  },
};

// =============================================================================
// Risk Factor and Matrix interfaces
// =============================================================================

export interface RiskFactor {
  id: AmsfFactorId;
  name: string;
  description: string;
  level: RiskLevel;
  justification: string;
  examples?: string[];
}

export interface RiskMatrix {
  id: string;
  name: string;
  description: string;
  icon: string;
  sector: string;
  isPreset: boolean;
  factors: RiskFactor[];
  overallLevel: RiskLevel;
  vigilanceLevel: VigilanceLevel;
  reviewFrequency: string;
  createdAt: string;
}

// =============================================================================
// Logic: compute overall risk level from factors
// Rule: if ANY factor is "élevé", overall is at least "moyen"
// If majority are "élevé", overall is "élevé"
// =============================================================================

export function computeOverallLevel(factors: Pick<RiskFactor, "level">[]): RiskLevel {
  if (factors.length === 0) return "faible";

  const counts: Record<RiskLevel, number> = { faible: 0, moyen: 0, eleve: 0 };
  for (const f of factors) {
    counts[f.level]++;
  }

  // If any factor is élevé, overall is at least moyen
  // If 2+ factors are élevé, overall is élevé
  // If majority (>= 3) are moyen or élevé, overall is at least moyen
  if (counts.eleve >= 2) return "eleve";
  if (counts.eleve >= 1) return "moyen";
  if (counts.moyen >= 3) return "moyen";
  if (counts.moyen >= 1 && counts.faible <= 3) return "moyen";

  return "faible";
}

export function riskLevelToVigilance(level: RiskLevel): VigilanceLevel {
  switch (level) {
    case "faible": return "simplifiee";
    case "moyen": return "standard";
    case "eleve": return "renforcee";
  }
}

export function riskLevelToReviewFrequency(level: RiskLevel): string {
  switch (level) {
    case "faible": return "3 ans";
    case "moyen": return "2 ans";
    case "eleve": return "1 an";
  }
}

// =============================================================================
// Helper to build a factor from the AMSF definitions
// =============================================================================

function buildFactor(id: AmsfFactorId, level: RiskLevel, justification: string): RiskFactor {
  const def = AMSF_FACTOR_DEFINITIONS[id];
  return {
    id,
    name: def.name,
    description: def.description,
    level,
    justification,
    examples: def.examples[level],
  };
}

// =============================================================================
// PRESET MATRICES — 5 sectors typical for Monaco
// =============================================================================

export const PRESET_MATRICES: RiskMatrix[] = [
  // ── Immobilier ──────────────────────────────────────────────────────────
  (() => {
    const factors: RiskFactor[] = [
      buildFactor(
        "produits_services",
        "moyen",
        "L'immobilier monégasque implique des montants élevés (> 1M EUR en moyenne) et peut servir de véhicule de blanchiment. Les transactions via SCI ajoutent de la complexité."
      ),
      buildFactor(
        "conditions_transactions",
        "moyen",
        "Les transactions immobilières sont souvent de montant élevé avec des modalités de financement variées (apport personnel, crédit, fonds étrangers). Le risque de fractionnement existe."
      ),
      buildFactor(
        "canaux_distribution",
        "moyen",
        "L'immobilier monégasque fait intervenir des intermédiaires (agents immobiliers, notaires, avocats). Certains acquéreurs sont introduits par des tiers non assujettis."
      ),
      buildFactor(
        "caracteristiques_clientele",
        "eleve",
        "La clientèle immobilière à Monaco comprend une proportion significative de PEP, de HNWI internationaux et de clients avec des structures de détention complexes (SCI, holdings)."
      ),
      buildFactor(
        "pays_zones_geographiques",
        "moyen",
        "Les acquéreurs proviennent de juridictions variées. Certains pays d'origine des fonds présentent un risque modéré. Monaco elle-même est sur la liste grise du GAFI."
      ),
    ];
    const overallLevel = computeOverallLevel(factors);
    return {
      id: "matrix-immobilier",
      name: "Immobilier",
      description: "Transactions immobilières, SCI, promotion immobilière. Focus sur l'origine des fonds, les structures de détention et la clientèle internationale.",
      icon: "🏠",
      sector: "immobilier",
      isPreset: true,
      factors,
      overallLevel,
      vigilanceLevel: riskLevelToVigilance(overallLevel),
      reviewFrequency: riskLevelToReviewFrequency(overallLevel),
      createdAt: "2026-01-01",
    };
  })(),

  // ── Création de société ─────────────────────────────────────────────────
  (() => {
    const factors: RiskFactor[] = [
      buildFactor(
        "produits_services",
        "moyen",
        "La création de sociétés monégasques (SAM, SCS, SCI) implique des structures juridiques qui peuvent être utilisées pour masquer les bénéficiaires effectifs."
      ),
      buildFactor(
        "conditions_transactions",
        "faible",
        "Les apports en capital sont généralement réalisés par virement bancaire depuis des établissements régulés. Les montants de constitution sont encadrés."
      ),
      buildFactor(
        "canaux_distribution",
        "moyen",
        "La constitution passe par des intermédiaires professionnels (avocats, fiduciaires) qui peuvent introduire des clients sans vérification préalable complète."
      ),
      buildFactor(
        "caracteristiques_clientele",
        "moyen",
        "Les créateurs de sociétés à Monaco incluent des non-résidents, des structures multi-niveaux et potentiellement des PEP. L'identification des UBO peut être complexe."
      ),
      buildFactor(
        "pays_zones_geographiques",
        "moyen",
        "Les actionnaires et UBO proviennent fréquemment de juridictions diverses, certaines à risque modéré. Les chaînes de détention peuvent traverser des juridictions opaques."
      ),
    ];
    const overallLevel = computeOverallLevel(factors);
    return {
      id: "matrix-creation-societe",
      name: "Création de société",
      description: "Constitution de sociétés monégasques (SAM, SCS, SCI). Focus sur l'identification des UBO, la structure de détention et l'objet social.",
      icon: "🏢",
      sector: "societe",
      isPreset: true,
      factors,
      overallLevel,
      vigilanceLevel: riskLevelToVigilance(overallLevel),
      reviewFrequency: riskLevelToReviewFrequency(overallLevel),
      createdAt: "2026-01-01",
    };
  })(),

  // ── Gestion de patrimoine ───────────────────────────────────────────────
  (() => {
    const factors: RiskFactor[] = [
      buildFactor(
        "produits_services",
        "eleve",
        "La gestion de patrimoine implique des produits complexes (private equity, hedge funds, structurations fiscales) et des montants très significatifs facilitant potentiellement le blanchiment."
      ),
      buildFactor(
        "conditions_transactions",
        "eleve",
        "Les transferts cross-border sont fréquents, les montants élevés et les opérations multi-devises. Les mouvements de fonds entre juridictions augmentent le risque."
      ),
      buildFactor(
        "canaux_distribution",
        "moyen",
        "Les clients sont souvent introduits par des apporteurs d'affaires ou des family offices. La relation peut débuter à distance avant une rencontre physique."
      ),
      buildFactor(
        "caracteristiques_clientele",
        "eleve",
        "Clientèle HNWI/UHNWI internationale avec forte proportion de PEP. Source de fortune parfois difficile à documenter. Structures patrimoniales complexes (trusts, fondations)."
      ),
      buildFactor(
        "pays_zones_geographiques",
        "moyen",
        "Les actifs sont répartis dans de multiples juridictions. Certains pays d'origine des fortunes sont à risque modéré à élevé. Flux financiers internationaux fréquents."
      ),
    ];
    const overallLevel = computeOverallLevel(factors);
    return {
      id: "matrix-wealth-management",
      name: "Gestion de patrimoine",
      description: "Family offices, gestion d'actifs, conseil patrimonial. Focus sur la source de fortune, les mouvements cross-border et les structures complexes.",
      icon: "💰",
      sector: "patrimoine",
      isPreset: true,
      factors,
      overallLevel,
      vigilanceLevel: riskLevelToVigilance(overallLevel),
      reviewFrequency: riskLevelToReviewFrequency(overallLevel),
      createdAt: "2026-01-01",
    };
  })(),

  // ── Banque privée ───────────────────────────────────────────────────────
  (() => {
    const factors: RiskFactor[] = [
      buildFactor(
        "produits_services",
        "moyen",
        "Les services bancaires privés incluent des comptes courants, crédits et placements. La diversité des produits et la possibilité de mouvements rapides augmentent le risque."
      ),
      buildFactor(
        "conditions_transactions",
        "moyen",
        "Les opérations bancaires courantes sont tracées mais les virements internationaux, les opérations en espèces et les crypto-actifs présentent un risque modéré."
      ),
      buildFactor(
        "canaux_distribution",
        "faible",
        "L'ouverture de compte en banque privée à Monaco se fait généralement en face-à-face avec identification physique et documentation complète."
      ),
      buildFactor(
        "caracteristiques_clientele",
        "moyen",
        "La clientèle bancaire monégasque est internationale, avec une proportion notable de non-résidents et potentiellement de PEP. Le profil économique doit être vérifié."
      ),
      buildFactor(
        "pays_zones_geographiques",
        "moyen",
        "Les titulaires de comptes proviennent de juridictions variées. Monaco accueille une clientèle internationale dont certains pays sont sous surveillance GAFI."
      ),
    ];
    const overallLevel = computeOverallLevel(factors);
    return {
      id: "matrix-banque",
      name: "Banque privée",
      description: "Ouverture de comptes, opérations bancaires, crédits. Scoring standard AMSF pour les établissements de crédit monégasques.",
      icon: "🏦",
      sector: "banque",
      isPreset: true,
      factors,
      overallLevel,
      vigilanceLevel: riskLevelToVigilance(overallLevel),
      reviewFrequency: riskLevelToReviewFrequency(overallLevel),
      createdAt: "2026-01-01",
    };
  })(),

  // ── Trust & Fondation ──────────────────────────────────────────────────
  (() => {
    const factors: RiskFactor[] = [
      buildFactor(
        "produits_services",
        "eleve",
        "Les trusts et fondations sont des structures intrinsèquement opaques avec séparation juridique de la propriété. Ils peuvent faciliter la dissimulation des bénéficiaires effectifs."
      ),
      buildFactor(
        "conditions_transactions",
        "moyen",
        "Les mouvements de fonds dans les trusts/fondations sont souvent transfrontaliers et de montants élevés. Les distributions aux bénéficiaires peuvent être discrétionnaires."
      ),
      buildFactor(
        "canaux_distribution",
        "eleve",
        "Les structures fiduciaires impliquent de multiples intermédiaires (trustees, protectors, conseillers) parfois dans des juridictions opaques. La relation indirecte complique l'identification."
      ),
      buildFactor(
        "caracteristiques_clientele",
        "eleve",
        "Les constituants (settlors) sont souvent des HNWI/UHNWI avec des profils complexes. Les bénéficiaires peuvent être discrétionnaires (non nommés). Forte probabilité de PEP."
      ),
      buildFactor(
        "pays_zones_geographiques",
        "eleve",
        "Les trusts et fondations sont fréquemment établis dans des juridictions à fiscalité privilégiée (Jersey, BVI, Liechtenstein) avec des connexions multi-juridictionnelles."
      ),
    ];
    const overallLevel = computeOverallLevel(factors);
    return {
      id: "matrix-trust-fondation",
      name: "Trust & Fondation",
      description: "Structures fiduciaires complexes. Vigilance renforcée systématique conformément aux recommandations AMSF sur les véhicules à risque élevé.",
      icon: "⚖️",
      sector: "trust",
      isPreset: true,
      factors,
      overallLevel,
      vigilanceLevel: riskLevelToVigilance(overallLevel),
      reviewFrequency: riskLevelToReviewFrequency(overallLevel),
      createdAt: "2026-01-01",
    };
  })(),
];

// =============================================================================
// Legacy compatibility: CATEGORY_LABELS (used in other pages)
// =============================================================================

const CATEGORY_LABELS: Record<string, string> = {
  produits_services: "Produits / Services",
  conditions_transactions: "Conditions de transactions",
  canaux_distribution: "Canaux de distribution",
  caracteristiques_clientele: "Caractéristiques clientèle",
  pays_zones_geographiques: "Pays / Zones géographiques",
  // Legacy keys still used in mock-data.ts
  client: "Client",
  geographic: "Géographique",
  product: "Produit / Activité",
  channel: "Canal",
  structure: "Structure",
};

export { CATEGORY_LABELS };
