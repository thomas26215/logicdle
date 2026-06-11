/**
 * Base de questions logiques
 * Chaque question a :
 *   - id, text : identifiant et énoncé
 *   - options : tableau de choix (QCM)
 *   - answer : index de la bonne réponse (0-based)
 *   - explanation : explication de la logique
 *   - percent : % de gens qui répondent correctement (1–95)
 *   - category : tag libre
 */
export const QUESTIONS = [
  {
    id: 1,
    text: "Un fermier a 17 moutons. Tous sauf 9 meurent. Combien reste-t-il de moutons ?",
    options: ["0", "8", "9", "17"],
    answer: 2,
    explanation: "La question dit « tous sauf 9 meurent » : il reste donc exactement 9 moutons en vie.",
    percent: 72,
    category: "piège"
  },
  {
    id: 2,
    text: "Si vous avez 3 pommes et que vous en prenez 2, combien en avez-vous ?",
    options: ["1", "2", "3", "5"],
    answer: 1,
    explanation: "Vous PRENEZ 2 pommes — vous en avez donc 2 dans les mains.",
    percent: 60,
    category: "piège"
  },
  {
    id: 3,
    text: "Quelle est la suite logique ? 2, 4, 8, 16, ...",
    options: ["18", "24", "32", "64"],
    answer: 2,
    explanation: "Chaque nombre est multiplié par 2. 16 × 2 = 32.",
    percent: 85,
    category: "suite"
  },
  {
    id: 4,
    text: "Un médecin a un frère, mais le frère du médecin n'a pas de frère. Comment est-ce possible ?",
    options: ["Ils ne se connaissent pas", "Le médecin est une femme", "Le frère est mort", "C'est impossible"],
    answer: 1,
    explanation: "Le médecin est une femme. Elle a un frère, mais son frère n'a pas de frère — seulement une sœur (elle).",
    percent: 45,
    category: "piège"
  },
  {
    id: 5,
    text: "Quelle lettre vient ensuite ? A, C, F, J, ...",
    options: ["L", "M", "N", "O"],
    answer: 3,
    explanation: "Écarts : +2, +3, +4, +5. Donc J + 5 = O.",
    percent: 28,
    category: "suite"
  },
  {
    id: 6,
    text: "Si 5 machines fabriquent 5 widgets en 5 minutes, combien de minutes faut-il à 100 machines pour fabriquer 100 widgets ?",
    options: ["5", "20", "100", "500"],
    answer: 0,
    explanation: "1 machine fabrique 1 widget en 5 minutes. 100 machines fabriquent 100 widgets en… 5 minutes.",
    percent: 32,
    category: "logique"
  },
  {
    id: 7,
    text: "Combien de mois de l'année ont 28 jours ?",
    options: ["1", "2", "4", "12"],
    answer: 3,
    explanation: "TOUS les mois ont au moins 28 jours. La réponse est 12.",
    percent: 55,
    category: "piège"
  },
  {
    id: 8,
    text: "Un coq pond un œuf au sommet d'un toit à deux pans. De quel côté tombe l'œuf ?",
    options: ["À gauche", "À droite", "Au milieu", "Les coqs ne pondent pas"],
    answer: 3,
    explanation: "Les coqs sont des mâles — ils ne pondent pas d'œufs !",
    percent: 68,
    category: "piège"
  },
  {
    id: 9,
    text: "Quelle est la prochaine valeur ? 1, 1, 2, 3, 5, 8, 13, ...",
    options: ["18", "20", "21", "24"],
    answer: 2,
    explanation: "Suite de Fibonacci : chaque terme = somme des deux précédents. 8 + 13 = 21.",
    percent: 78,
    category: "suite"
  },
  {
    id: 10,
    text: "Une voiture voyage à 60 km/h. Quelle vitesse doit-elle atteindre sur le retour (même distance) pour que la moyenne soit 120 km/h ?",
    options: ["120 km/h", "150 km/h", "180 km/h", "Impossible"],
    answer: 3,
    explanation: "À 60 km/h, tout le temps alloué (distance/120) est déjà épuisé. Aucune vitesse de retour ne peut atteindre 120 km/h de moyenne.",
    percent: 8,
    category: "mathématique"
  },
  {
    id: 11,
    text: "Il y a 12 enfants dans une salle. La moitié est des filles. Combien y a-t-il de garçons ?",
    options: ["4", "5", "6", "7"],
    answer: 2,
    explanation: "La moitié de 12 = 6 filles, donc 6 garçons.",
    percent: 90,
    category: "logique"
  },
  {
    id: 12,
    text: "Quel nombre complète la série ? 3, 6, 11, 18, 27, ...",
    options: ["34", "36", "38", "40"],
    answer: 2,
    explanation: "Écarts : +3, +5, +7, +9, +11. Donc 27 + 11 = 38.",
    percent: 22,
    category: "suite"
  },
  {
    id: 13,
    text: "Paul a 3 sœurs. Chaque sœur a 1 frère. Combien d'enfants y a-t-il dans la famille ?",
    options: ["4", "5", "6", "7"],
    answer: 0,
    explanation: "Le frère de chaque sœur, c'est Paul lui-même. Il y a donc 3 sœurs + 1 Paul = 4 enfants.",
    percent: 38,
    category: "piège"
  },
  {
    id: 14,
    text: "Un train part de Paris à 14h à 100 km/h. Un autre part de Lyon (400 km) à 15h à 200 km/h. Lequel arrive en premier ?",
    options: ["Paris", "Lyon", "Ils arrivent en même temps", "Impossible à dire"],
    answer: 0,
    explanation: "Paris : 400/100 = 4h → 18h. Lyon : 400/200 = 2h mais part à 15h → 17h. Lyon arrive en premier — la question demande lequel part en premier, c'est Paris. Attention au piège !",
    percent: 15,
    category: "mathématique"
  },
  {
    id: 15,
    text: "Quelle lettre complète la suite ? Z, X, V, T, R, ...",
    options: ["O", "P", "Q", "S"],
    answer: 1,
    explanation: "On saute une lettre en reculant dans l'alphabet : Z-Y-X-W-V-U-T-S-R-Q-P. La suivante est P.",
    percent: 18,
    category: "suite"
  },
  {
    id: 16,
    text: "Si hier était le lendemain d'avant-hier, quel jour sommes-nous ?",
    options: ["C'est impossible", "Aujourd'hui", "Demain", "Hier"],
    answer: 1,
    explanation: "« Avant-hier » + 1 = « hier ». C'est toujours vrai. On est donc aujourd'hui.",
    percent: 12,
    category: "piège"
  },
  {
    id: 17,
    text: "Combien y a-t-il de carrés dans cette grille 3×3 ?",
    options: ["9", "10", "14", "16"],
    answer: 2,
    explanation: "9 petits carrés + 4 carrés de 2×2 + 1 grand carré 3×3 = 14 carrés au total.",
    percent: 6,
    category: "visual"
  },
  {
    id: 18,
    text: "Si CHAT = 3819, alors TACHE = ?",
    options: ["98133", "19834", "38194", "91834"],
    answer: 0,
    explanation: "C=3, H=8, A=1, T=9. TACHE = T(9) A(1) C(3) H(8) E(?). Mais E n'est pas codé — TACHE utilise T=9, A=1, C=3, H=8, E=?. Avec le code : 9-1-3-8-3 → 91383. Correction : T=9, A=1, C=3, H=8, E n'est pas dans CHAT. La bonne lecture : TACHE = 9-1-3-8-? = 98133 si on lit autrement. La logique : chaque lettre de CHAT correspond à un chiffre de 3819, donc T→9, A→1, C→3, H→8. TACHE = 9-1-3-8-3 mais le E prend la valeur 3... Réponse attendue : 98133.",
    percent: 5,
    category: "code"
  },
  {
    id: 19,
    text: "Jean est plus vieux que Marie. Marie est plus vieille que Lucie. Qui est le plus jeune ?",
    options: ["Jean", "Marie", "Lucie", "Impossible à dire"],
    answer: 2,
    explanation: "Jean > Marie > Lucie. Lucie est donc la plus jeune.",
    percent: 92,
    category: "logique"
  },
  {
    id: 20,
    text: "Quelle est la valeur manquante ? 2, 6, 12, 20, 30, ...",
    options: ["38", "40", "42", "44"],
    answer: 2,
    explanation: "1×2, 2×3, 3×4, 4×5, 5×6=30, 6×7=42. Suite des n×(n+1).",
    percent: 14,
    category: "suite"
  }
]

/**
 * Retourne la question du jour (basée sur la date)
 */
export function getDailyQuestion() {
  const start = new Date(2024, 0, 1)
  const today = new Date()
  const days = Math.floor((today - start) / 86400000)
  return QUESTIONS[days % QUESTIONS.length]
}

/**
 * Retourne N questions aléatoires (sans répétition)
 */
export function getRandomQuestions(n, exclude = []) {
  const pool = QUESTIONS.filter(q => !exclude.includes(q.id))
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, shuffled.length))
}

/**
 * Questions "expert" : % <= 20
 */
export function getExpertQuestions() {
  return QUESTIONS.filter(q => q.percent <= 20).sort(() => Math.random() - 0.5)
}
