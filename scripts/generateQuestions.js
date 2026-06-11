#!/usr/bin/env node

/**
 * Générateur de questions avec taux de réussite automatique
 * 
 * Ce script génère des questions avec un pourcentage de réussite spécifié.
 * Les correctCount et wrongCount sont calculés automatiquement.
 * 
 * Usage: 
 *   node scripts/generateQuestions.js --count 10 --success-rate 75 --total-attempts 100
 *   node scripts/generateQuestions.js (mode interactif)
 */

import dotenv from 'dotenv'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import readline from 'readline'

dotenv.config({ path: '.env.local' })

// Configuration Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer)
    })
  })
}

// Catégories de questions disponibles
const categories = ['logique', 'code', 'matrice', 'déduction', 'suite', 'raisonnement', 'piège', 'intrus', 'analogie']

// Templates de questions
const questionTemplates = {
  logique: [
    'Quelle est la suite logique: {answer}?',
    'Trouvez le pattern: {answer}',
    'Complétez la séquence: {answer}'
  ],
  code: [
    'Si A=1, alors B=? (réponse: {answer})',
    'Décodez cette séquence: le résultat est {answer}',
    'Suivant le code: {answer}'
  ],
  matrice: [
    'Dans cette grille 3x3, la réponse est: {answer}',
    'Complétez la matrice avec: {answer}',
    'La somme manquante est: {answer}'
  ],
  déduction: [
    'Par déduction logique: {answer}',
    'Qui est le plus... ? Réponse: {answer}',
    'D\'après les indices: {answer}'
  ],
  suite: [
    'Suite de nombres: 1, 2, 3, ... le prochain est {answer}',
    'Séquence: 5, 10, 15, ... continuez avec {answer}',
    'Pattern: 2, 4, 8, ... la suite est {answer}'
  ],
  raisonnement: [
    'Si 3 personnes font un travail, alors {answer}',
    'Combien de temps pour... ? Réponse: {answer}',
    'Le calcul donne: {answer}'
  ]
}

// Options de réponse
const answerOptions = [
  { text: 'Option A', value: 'A' },
  { text: 'Option B', value: 'B' },
  { text: 'Option C', value: 'C' },
  { text: 'Option D', value: 'D' }
]

/**
 * Calcule correctCount et wrongCount basé sur un pourcentage
 */
function calculateStats(successRate, totalAttempts) {
  const correctCount = Math.round((successRate / 100) * totalAttempts)
  const wrongCount = totalAttempts - correctCount
  return { correctCount, wrongCount }
}

/**
 * Génère une question avec stats
 */
function generateQuestion(number, category, successRate, totalAttempts) {
  const templates = questionTemplates[category] || questionTemplates.logique
  const template = templates[Math.floor(Math.random() * templates.length)]
  const answerText = answerOptions[Math.floor(Math.random() * answerOptions.length)].text
  
  const { correctCount, wrongCount } = calculateStats(successRate, totalAttempts)

  return {
    text: template.replace('{answer}', answerText),
    category,
    options: answerOptions.map(opt => opt.text),
    answer: Math.floor(Math.random() * 4), // Index aléatoire de la bonne réponse
    correctCount,
    wrongCount,
    percent: successRate
  }
}

/**
 * Mode interactif
 */
async function interactiveMode() {
  console.log('\n🎯 GÉNÉRATEUR DE QUESTIONS\n')
  console.log('═════════════════════════════════════════════════════════════════\n')

  const countStr = await question('Combien de questions voulez-vous générer? (défaut: 5): ')
  const count = parseInt(countStr) || 5

  const successRateStr = await question('Quel taux de réussite moyen? (0-100, défaut: 50): ')
  const successRate = parseInt(successRateStr) || 50

  const attemptsStr = await question('Nombre total d\'attempts par question? (défaut: 100): ')
  const totalAttempts = parseInt(attemptsStr) || 100

  console.log(`\nCatégories disponibles: ${categories.join(', ')}\n`)
  const category = await question('Quelle catégorie? (défaut: logique): ')
  const selectedCategory = categories.includes(category) ? category : 'logique'

  return { count, successRate, totalAttempts, category: selectedCategory }
}

/**
 * Mode ligne de commande
 */
function cliMode() {
  const args = process.argv.slice(2)
  const params = {}

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '')
    const value = args[i + 1]
    params[key] = value
  }

  return {
    count: parseInt(params['count']) || 5,
    successRate: parseInt(params['success-rate']) || 50,
    totalAttempts: parseInt(params['total-attempts']) || 100,
    category: params['category'] || 'logique'
  }
}

/**
 * Sauvegarde les questions dans Firebase
 */
async function saveQuestionsToFirebase(questions) {
  try {
    console.log('\n📤 Sauvegarde dans Firebase...\n')
    const questionsRef = collection(db, 'questions')
    
    let saved = 0
    for (const q of questions) {
      try {
        const docRef = await addDoc(questionsRef, {
          ...q,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        saved++
        const realPercent = Math.round((q.correctCount / (q.correctCount + q.wrongCount)) * 100)
        console.log(`  ✓ Question #${docRef.id} sauvegardée (${realPercent}% réussite)`)
      } catch (error) {
        console.log(`  ✗ Erreur lors de la sauvegarde: ${error.message}`)
      }
    }

    console.log(`\n✅ ${saved}/${questions.length} questions sauvegardées`)
    
    // Statistiques
    const totalCorrect = questions.reduce((sum, q) => sum + q.correctCount, 0)
    const totalWrong = questions.reduce((sum, q) => sum + q.wrongCount, 0)
    const totalAttempts = totalCorrect + totalWrong
    const avgPercent = Math.round((totalCorrect / totalAttempts) * 100)

    console.log('\n📊 STATISTIQUES')
    console.log('═════════════════════════════════════════════════════════════════')
    console.log(`  Total réponses correctes: ${totalCorrect}`)
    console.log(`  Total mauvaises réponses: ${totalWrong}`)
    console.log(`  Pourcentage moyen: ${avgPercent}%`)
    console.log('═════════════════════════════════════════════════════════════════\n')

  } catch (error) {
    console.error('❌ Erreur Firebase:', error.message)
  } finally {
    process.exit(0)
  }
}

/**
 * Main
 */
async function main() {
  try {
    console.log('🔥 Initialisation Firebase...')
    console.log(`📁 Projet: ${firebaseConfig.projectId}\n`)

    // Déterminer le mode
    const hasCliArgs = process.argv.slice(2).some(arg => arg.startsWith('--'))
    const params = hasCliArgs ? cliMode() : await interactiveMode()

    console.log('\n🔧 Paramètres:')
    console.log('═════════════════════════════════════════════════════════════════')
    console.log(`  Questions à générer: ${params.count}`)
    console.log(`  Taux de réussite: ${params.successRate}%`)
    console.log(`  Attempts par question: ${params.totalAttempts}`)
    console.log(`  Catégorie: ${params.category}`)
    console.log('═════════════════════════════════════════════════════════════════\n')

    // Générer les questions
    console.log('🎲 Génération des questions...\n')
    const questions = []
    for (let i = 0; i < params.count; i++) {
      const q = generateQuestion(
        i + 1,
        params.category,
        params.successRate,
        params.totalAttempts
      )
      questions.push(q)
      const realPercent = Math.round((q.correctCount / (q.correctCount + q.wrongCount)) * 100)
      console.log(`  [${i + 1}] ${q.text.substring(0, 50)}... (${realPercent}%)`)
    }

    // Sauvegarder
    await saveQuestionsToFirebase(questions)

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()
