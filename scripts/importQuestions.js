#!/usr/bin/env node

/**
 * Script d'import des questions vers Firebase
 * Usage: node scripts/importQuestions.js
 */

import dotenv from 'dotenv'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore'
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

async function importQuestions() {
  try {
    // Lire le fichier questionsFirebase.json
    const jsonPath = path.join(__dirname, '../src/data/questionsFirebase.json')
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    const questionsData = jsonData.questions || jsonData
    
    console.log(`\n📚 ${questionsData.length} questions à importer...`)
    
    const questionsRef = collection(db, 'questions')
    let imported = 0
    let errors = 0
    
    for (const question of questionsData) {
      try {
        const docRef = doc(questionsRef, String(question.id))
        await setDoc(docRef, {
          id: question.id,
          text: question.text,
          options: question.options,
          answer: question.answer,
          explanation: question.explanation,
          category: question.category,
          correctCount: question.correctCount || 0,
          wrongCount: question.wrongCount || 0,
          createdAt: new Date().toISOString()
        })
        imported++
        console.log(`✅ Question ${question.id} importée`)
      } catch (error) {
        errors++
        console.error(`❌ Erreur pour la question ${question.id}: ${error.message}`)
      }
    }
    
    console.log(`\n🎉 Import terminé!`)
    console.log(`✅ ${imported} questions importées`)
    if (errors > 0) {
      console.log(`⚠️  ${errors} erreurs`)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error.message)
    process.exit(1)
  } finally {
    // Fermer la connexion
    process.exit(0)
  }
}

importQuestions()
