#!/usr/bin/env node

/**
 * Script pour créer la question du jour
 * Crée une collection dailyQuestion{date} avec une question aléatoire
 * Usage: node scripts/createDailyQuestion.js
 */

import dotenv from 'dotenv'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore'
import { fileURLToPath } from 'url'
import path from 'path'

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

// Générer la date au format YYYY-MM-DD
function getTodayDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function createDailyQuestion() {
  try {
    const today = getTodayDate()
    const collectionName = 'dailyQuestions'
    
    console.log('🔥 Initialisation Firebase...')
    console.log(`📁 Projet: ${firebaseConfig.projectId}`)
    console.log(`📅 Date: ${today}`)
    
    // Récupérer toutes les questions
    console.log('\n📚 Récupération des questions...')
    const questionsRef = collection(db, 'questions')
    const questionsSnapshot = await getDocs(questionsRef)
    
    const questions = []
    questionsSnapshot.forEach(doc => {
      questions.push({ id: doc.id, ...doc.data() })
    })
    
    if (questions.length === 0) {
      console.error('❌ Aucune question trouvée dans la collection "questions"')
      process.exit(1)
    }
    
    console.log(`✅ ${questions.length} questions trouvées`)
    
    // Sélectionner une question aléatoire
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)]
    console.log(`\n🎲 Question sélectionnée: #${randomQuestion.id} - ${randomQuestion.text.substring(0, 50)}...`)
    
    // Créer la collection dailyQuestion{date} et ajouter la question
    console.log(`\n📝 Création de la collection "${collectionName}"...`)
    const dailyQuestionRef = collection(db, collectionName)
    const docRef = doc(dailyQuestionRef, today)
    
    await setDoc(docRef, {
      questionId: randomQuestion.id
    })
    
    console.log(`✅ Question du jour créée dans "${collectionName}"`)
    console.log(`\n🎉 Succès!`)
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

createDailyQuestion()
