
import { QUESTIONS } from '@/data/questions.js'
import { upsertQuestion, getQuestionsStats } from './questionsService.js'

/**
 * Initialise Firebase avec les questions du fichier local
 * À appeler une seule fois pour peupler la base de données
 */
export async function initializeQuestionsFromLocal() {
  console.log('Initialisation de Firebase avec les questions locales...')
  
  const results = {
    success: 0,
    failed: 0,
    errors: []
  }
  
  for (const question of QUESTIONS) {
    try {
      const result = await upsertQuestion(String(question.id), {
        id: question.id,
        text: question.text,
        options: question.options,
        answer: question.answer,
        explanation: question.explanation,
        percent: question.percent,
        category: question.category,
        correctCount: 0,
        wrongCount: 0,
        createdAt: new Date().toISOString()
      })
      
      if (result.success) {
        results.success++
        console.log(`✓ Question ${question.id} créée`)
      } else {
        results.failed++
        results.errors.push(`Question ${question.id}: ${result.error}`)
      }
    } catch (err) {
      results.failed++
      results.errors.push(`Question ${question.id}: ${err.message}`)
    }
  }
  
  console.log(`Initialisation terminée: ${results.success} réussies, ${results.failed} échouées`)
  
  if (results.errors.length > 0) {
    console.error('Erreurs:', results.errors)
  }
  
  return results
}

/**
 * Affiche les statistiques de Firebase
 */
export async function printQuestionsStats() {
  const stats = await getQuestionsStats()
  
  if (stats.success) {
    console.log('📊 Statistiques Firebase:')
    console.log(`  - Nombre de questions: ${stats.data.totalQuestions}`)
    console.log(`  - Total de réponses correctes: ${stats.data.totalCorrect}`)
    console.log(`  - Total de réponses incorrectes: ${stats.data.totalWrong}`)
    console.log(`  - Pourcentage global: ${stats.data.globalCorrectPercent}%`)
    console.log(`  - Total de réponses: ${stats.data.totalResponses}`)
  } else {
    console.error('Erreur:', stats.error)
  }
}
