#!/usr/bin/env node

/**
 * Script pour réinitialiser tous les correctCount et wrongCount à 1
 * Usage: node scripts/resetQuestionStats.js
 */

import dotenv from 'dotenv'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore'

// Charger les variables d'environnement
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

// Initialiser Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

console.log('🔥 Initialisation Firebase...')
console.log(`📁 Projet: ${firebaseConfig.projectId}\n`)

async function resetQuestionStats() {
  try {
    console.log('📚 Récupération de toutes les questions...')
    const questionsRef = collection(db, 'questions')
    const questionsSnapshot = await getDocs(questionsRef)

    console.log(`✅ ${questionsSnapshot.size} questions trouvées\n`)
    console.log('🔄 Réinitialisation des statistiques...\n')

    let updated = 0
    let errors = 0

    for (const docSnapshot of questionsSnapshot.docs) {
      try {
        const docRef = doc(db, 'questions', docSnapshot.id)
        await updateDoc(docRef, {
          correctCount: 1,
          wrongCount: 1
        })
        updated++
        console.log(`  ✓ Question #${docSnapshot.id} réinitialisée`)
      } catch (error) {
        errors++
        console.log(`  ✗ Erreur Question #${docSnapshot.id}: ${error.message}`)
      }
    }

    console.log('\n═════════════════════════════════════════════════════════════════')
    console.log(`\n✅ Réinitialisation terminée!`)
    console.log(`   Mises à jour réussies: ${updated}/${questionsSnapshot.size}`)
    if (errors > 0) {
      console.log(`   Erreurs: ${errors}`)
    }
    console.log('\n═════════════════════════════════════════════════════════════════\n')

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

resetQuestionStats()
