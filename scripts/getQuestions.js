#!/usr/bin/env node

/**
 * Script pour récupérer toutes les questions depuis Firebase
 * Usage: node scripts/getQuestions.js
 */

import dotenv from 'dotenv'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
}

// Initialiser Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

console.log('🔥 Initialisation Firebase...')
console.log(`📁 Projet: ${firebaseConfig.projectId}`)

async function getAllQuestions() {
  try {
    console.log('\n📚 Récupération de toutes les questions...')
    const questionsRef = collection(db, 'questions')
    const questionsSnapshot = await getDocs(questionsRef)

    const questions = []
    questionsSnapshot.forEach(doc => {
      questions.push({
        id: doc.id,
        ...doc.data()
      })
    })

    console.log(`\n✅ ${questions.length} questions trouvées\n`)

    // Afficher en tableau
    console.log('═════════════════════════════════════════════════════════════════')
    questions.forEach(q => {
      const percent = q.correctCount && q.wrongCount 
        ? Math.round((q.correctCount / (q.correctCount + q.wrongCount)) * 100)
        : 0
      
      console.log(`\n📌 Question #${q.id}`)
      console.log(`   Texte: ${q.text.substring(0, 60)}...`)
      console.log(`   Catégorie: ${q.category}`)
      console.log(`   Réponse correcte: ${q.options[q.answer]}`)
      console.log(`   Correctes: ${q.correctCount || 0} | Mauvaises: ${q.wrongCount || 0} | %: ${percent}%`)
    })

    console.log('\n═════════════════════════════════════════════════════════════════')

    // Sauvegarder en JSON
    const outputPath = path.join(__dirname, '../src/data/questionsExport.json')
    fs.writeFileSync(outputPath, JSON.stringify({ questions }, null, 2))
    console.log(`\n💾 Sauvegardé dans: ${outputPath}`)

    // Statistiques globales
    const stats = {
      total: questions.length,
      totalCorrect: questions.reduce((sum, q) => sum + (q.correctCount || 0), 0),
      totalWrong: questions.reduce((sum, q) => sum + (q.wrongCount || 0), 0),
      categories: [...new Set(questions.map(q => q.category))],
      averagePercent: Math.round(
        questions.reduce((sum, q) => {
          const total = (q.correctCount || 0) + (q.wrongCount || 0)
          return sum + (total > 0 ? (q.correctCount || 0) / total : 0)
        }, 0) / questions.length * 100
      )
    }

    console.log('\n📊 STATISTIQUES GLOBALES')
    console.log('═════════════════════════════════════════════════════════════════')
    console.log(`  Total questions: ${stats.total}`)
    console.log(`  Réponses correctes totales: ${stats.totalCorrect}`)
    console.log(`  Réponses mauvaises totales: ${stats.totalWrong}`)
    console.log(`  Pourcentage moyen: ${stats.averagePercent}%`)
    console.log(`  Catégories: ${stats.categories.join(', ')}`)
    console.log('═════════════════════════════════════════════════════════════════\n')

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

getAllQuestions()
