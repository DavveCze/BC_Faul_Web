import { StudentProfileData } from '../types/index';

export interface QuizQuestion {
  id: string;
  text: string;
  category: 'activity' | 'motivation' | 'style';
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    text: 'Největší radost mám, když mohu navrhnout a postavit něco funkčního, co má hezké rozhraní a lidé to mohou okamžitě zkoušet.',
    category: 'activity',
  },
  {
    id: 'q2',
    text: 'Když narazím na složitý problém, raději jdu do hloubky a zkoumám podstatu, i kdybych měl/a strávit hodiny bádáním v dokumentaci a datech.',
    category: 'activity',
  },
  {
    id: 'q3',
    text: 'Při práci na projektu potřebuji volnou ruku a důvěru – nejlépe funguji, když si sám/sama určuji postup a nikdo mi nestojí za zády.',
    category: 'motivation',
  },
  {
    id: 'q4',
    text: 'Baví mě vytvářet nástroje, materiály nebo návody, které ostatním usnadní práci a pomohou jim lépe pochopit složité věci.',
    category: 'activity',
  },
  {
    id: 'q5',
    text: 'Mám rád/a preciznost, pořádek v datech a jasná pravidla. Chaos mě znervózňuje, raději sázím na ověřené a spolehlivé postupy.',
    category: 'style',
  },
  {
    id: 'q6',
    text: 'Láká mě řešit výzvy, na kterých si ostatní vylámali zuby – čím složitější oříšek to je, tím větší motivaci mám ho pokořit.',
    category: 'motivation',
  },
  {
    id: 'q7',
    text: 'Rád/a zkouším nové experimentální technologie, neotřelé nápady a originální cesty, i když u nich hrozí slepé uličky.',
    category: 'style',
  },
  {
    id: 'q8',
    text: 'Více mě naplňuje zkoumat souvislosti, pracovat s čísly, grafy a algoritmy než psát rozsáhlé textové úvahy a eseje.',
    category: 'activity',
  },
  {
    id: 'q9',
    text: 'Mám chuť vést vlastní projekt, propojovat lidi, organizovat práci a přemýšlet nad tím, aby měl výsledek reálný praktický dopad.',
    category: 'motivation',
  },
  {
    id: 'q10',
    text: 'U závěrečné práce je pro mě nejdůležitější, aby po mně zůstal konkrétní softwarový výsledek nebo aplikace, ne jen teoretický text na papíře.',
    category: 'activity',
  },
  {
    id: 'q11',
    text: 'U vedoucího práce nejvíce ocením, když mi poskytne jasné mantinely a pravidelné konzultace, abych měl/a jistotu, že jdu správným směrem.',
    category: 'style',
  },
  {
    id: 'q12',
    text: 'Fascinuje mě optimalizace – ladit výkon, zkoumat architekturu a dosáhnout toho, aby systém běžel maximálně efektivně a čistě.',
    category: 'activity',
  },
];

/**
 * Normalizuje odpověď na pětibodové škále (1 až 5) do intervalu [0.0, 1.0]
 */
export const normalizeAnswer = (val: number | undefined): number => {
  const v = val ?? 3;
  return Math.max(0, Math.min(1, (v - 1) / 4));
};

/**
 * Spočítá kompletní profil studenta na základě 12 otázek
 * s využitím váhové matice příspěvků (Cross-dimensional Contribution Matrix).
 */
export const calculateProfileFromAnswers = (
  answers: Record<string, number>,
  hobbyKeywords: string[] = []
): StudentProfileData => {
  // Normalizované hodnoty q1..q12 v [0, 1]
  const q: Record<string, number> = {};
  for (let i = 1; i <= 12; i++) {
    q[`q${i}`] = normalizeAnswer(answers[`q${i}`]);
  }

  // 1. RIASEC model (vícedimenzionální vážený průměr)
  // R (Realistický / praktický vývoj a technika)
  const rSum = q.q1 * 0.4 + q.q9 * 0.25 + q.q10 * 0.35 + q.q12 * 0.2;
  const rWeight = 0.4 + 0.25 + 0.35 + 0.2; // 1.2
  const R = Math.max(0.1, Math.min(1.0, rSum / rWeight));

  // I (Investigativní / bádání a analýza)
  const iSum = q.q2 * 0.5 + q.q6 * 0.35 + q.q8 * 0.35 + q.q12 * 0.25;
  const iWeight = 0.5 + 0.35 + 0.35 + 0.25; // 1.45
  const I = Math.max(0.1, Math.min(1.0, iSum / iWeight));

  // A (Umělecký / estetika a originalita)
  const aSum = q.q1 * 0.45 + q.q4 * 0.2 + q.q7 * 0.35;
  const aWeight = 0.45 + 0.2 + 0.35; // 1.0
  const A = Math.max(0.1, Math.min(1.0, aSum / aWeight));

  // S (Sociální / edukace a pomoc lidem)
  const sSum = q.q4 * 0.55 + q.q9 * 0.25;
  const sWeight = 0.55 + 0.25; // 0.8
  const S = Math.max(0.1, Math.min(1.0, sSum / sWeight));

  // E (Podnikavý / iniciativa a dopad)
  const eSum = q.q3 * 0.25 + q.q9 * 0.5 + q.q1 * 0.15;
  const eWeight = 0.25 + 0.5 + 0.15; // 0.9
  const E = Math.max(0.1, Math.min(1.0, eSum / eWeight));

  // C (Konvenční / řád a preciznost)
  const cSum = q.q5 * 0.5 + q.q8 * 0.2 + q.q11 * 0.25 + q.q12 * 0.3;
  const cWeight = 0.5 + 0.2 + 0.25 + 0.3; // 1.25
  const C = Math.max(0.1, Math.min(1.0, cSum / cWeight));

  // 2. Scheinovy kariérní kotvy (výpočet vah a určení dominantních kotev)
  const anchorScores: Record<string, number> = {
    TF: (q.q2 * 0.3 + q.q10 * 0.25 + q.q12 * 0.45) / 1.0,   // Odborná kompetence
    AU: (q.q3 * 0.6 + q.q7 * 0.2) / 0.8,                     // Autonomie
    CH: (q.q6 * 0.5 + q.q7 * 0.3) / 0.8,                     // Čistá výzva
    SV: (q.q4 * 0.45 + q.q9 * 0.35) / 0.8,                   // Služba a oddanost věci
    SE: (q.q5 * 0.4 + q.q11 * 0.4) / 0.8,                    // Jistota a stabilita
    GM: (q.q9 * 0.5 + q.q3 * 0.2) / 0.7,                     // Obecný management
  };

  // Seřadíme kotvy a vybereme 2 dominantní
  const sortedAnchors = Object.entries(anchorScores).sort((a, b) => b[1] - a[1]);
  const topAnchor1 = sortedAnchors[0][0];
  const topAnchor2 = sortedAnchors[1][0];

  // Normalizované váhy pro 2 vybrané kotvy (součet = 1.0)
  const rawSum = anchorScores[topAnchor1] + anchorScores[topAnchor2];
  const career_anchors: Record<string, number> = {};
  if (rawSum > 0) {
    career_anchors[topAnchor1] = Number((anchorScores[topAnchor1] / rawSum).toFixed(2));
    career_anchors[topAnchor2] = Number((anchorScores[topAnchor2] / rawSum).toFixed(2));
  } else {
    career_anchors['TF'] = 0.6;
    career_anchors['AU'] = 0.4;
  }

  // 3. Styl řešení problémů: 0 = adaptivní / osvědčený, 1 = inovativní / experimentální
  const styleSum = q.q7 * 0.5 + (1 - q.q5) * 0.3 + q.q6 * 0.2;
  const problem_solving_style = Number(Math.max(0.1, Math.min(0.95, styleSum)).toFixed(2));

  // 4. Orientace: 0 = didaktická / sociální / textová, 1 = datově-technická
  const orientSum = q.q8 * 0.45 + q.q12 * 0.3 + (1 - q.q4) * 0.25;
  const orientation_type = Number(Math.max(0.1, Math.min(0.95, orientSum)).toFixed(2));

  // 5. Typ výstupu: 0 = teoretická / analytická rešerše, 1 = funkční softwarový produkt
  const outputSum = q.q10 * 0.55 + q.q1 * 0.25 + q.q12 * 0.2;
  const output_type = Number(Math.max(0.1, Math.min(0.95, outputSum)).toFixed(2));

  // 6. Míra supervize: 0 = intenzivní vedení krok za krokem, 1 = vysoká samostatnost
  const supSum = q.q3 * 0.5 + (1 - q.q11) * 0.4 + q.q6 * 0.1;
  const supervision_preference = Number(Math.max(0.1, Math.min(0.95, supSum)).toFixed(2));

  return {
    riasec: {
      R: Number(R.toFixed(2)),
      I: Number(I.toFixed(2)),
      A: Number(A.toFixed(2)),
      S: Number(S.toFixed(2)),
      E: Number(E.toFixed(2)),
      C: Number(C.toFixed(2)),
    },
    career_anchors,
    problem_solving_style,
    orientation_type,
    output_type,
    supervision_preference,
    hobby_keywords: hobbyKeywords,
  };
};

/**
 * Pomocná funkce pro slovní interpretaci výsledků profilu pro studenta
 */
export const getProfileInsights = (profile: StudentProfileData) => {
  const riasecLabels: Record<string, string> = {
    R: 'Prakticko-technický (Realistický)',
    I: 'Analyticko-výzkumný (Investigativní)',
    A: 'Kreativně-designový (Umělecký)',
    S: 'Edukativně-společenský (Sociální)',
    E: 'Iniciativní a projektový (Podnikavý)',
    C: 'Systematicko-organizační (Konvenční)',
  };

  const anchorLabels: Record<string, string> = {
    TF: 'Odborná technologická kompetence',
    AU: 'Autonomie a nezávislost',
    CH: 'Čistá intelektuální výzva',
    SV: 'Smysluplnost a společenský přínos',
    SE: 'Jistota, stabilita a jasné zadání',
    GM: 'Organizace a koordinace projektů',
  };

  // Top 2 dimenze RIASEC
  const sortedRiasec = Object.entries(profile.riasec).sort((a, b) => b[1] - a[1]);
  const maxVal = sortedRiasec[0][1];
  const minVal = sortedRiasec[sortedRiasec.length - 1][1];
  const isBalanced = maxVal - minVal <= 0.05; // všude stejné nebo téměř stejné skóre

  const code1 = sortedRiasec[0][0];
  const code2 = sortedRiasec[1][0];
  const hollandCode = isBalanced ? 'VŠESTRANNÝ' : `${code1}${code2}`;

  const archetypeMap: Record<string, string> = {
    IR: 'Analytický softwarový vývojář',
    RI: 'Technologický inženýr a stavitel systémů',
    IA: 'Výzkumník v oblasti UX a inteligentních rozhraní',
    AI: 'Kreativní designér a frontend architekt',
    RC: 'Databázový specialista a systémový správce',
    CR: 'Precizní vývojář a backend administrátor',
    IC: 'Datový analytik a algoritmický inženýr',
    CI: 'Informační architekt a procesní analytik',
    RA: 'Prototypový vývojář a multimediální inženýr',
    AR: 'Interaktivní tvůrce a vývojář vizualizací',
    IS: 'Kognitivní a edukační informatik',
    SI: 'Edukátor v IT a didaktik nových technologií',
    ES: 'Projektový manažer a vedoucí IT týmů',
    SE: 'Společensky orientovaný koordinátor a konzultant',
    EI: 'Technologický produktový stratég',
    IE: 'Inovační vývojář se zaměřením na reálné využití',
  };

  const archetypeTitle = isBalanced ? 'Všestranně vyvážený profil' : archetypeMap[hollandCode] || archetypeMap[`${code2}${code1}`] || 'Technologicko-analytický profil';

  const dominantRiasec = isBalanced ? ['Rovnoměrný zájem o technologie, bádání i lidi'] : [
    riasecLabels[code1] || code1,
    riasecLabels[code2] || code2,
  ];

  // Top kotvy
  const dominantAnchors = isBalanced
    ? ['Vyvážená kombinace profesních motivátorů']
    : Object.keys(profile.career_anchors).map(
        (code) => anchorLabels[code] || code
      );

  return {
    isBalanced,
    hollandCode,
    archetypeTitle,
    dominantRiasec,
    dominantAnchors,
    outputLabel:
      profile.output_type >= 0.6
        ? 'Softwarová aplikace / funkční prototyp'
        : profile.output_type <= 0.4
        ? 'Analytická / teoretická studie'
        : 'Vyvážený poměr mezi aplikací a analýzou',
    problemSolvingLabel:
      profile.problem_solving_style >= 0.6
        ? 'Inovativní & experimentální postupy'
        : profile.problem_solving_style <= 0.4
        ? 'Osvědčené technologie & standardy'
        : 'Vyvážený přístup k inovacím',
    supervisionLabel:
      profile.supervision_preference >= 0.6
        ? 'Vysoká samostatnost a volná ruka'
        : profile.supervision_preference <= 0.4
        ? 'Pravidelné konzultace a jasné mantinely'
        : 'Vyvážená míra konzultací a samostatnosti',
  };
};
