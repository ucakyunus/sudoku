import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { GameRecord, Difficulty } from '@/types/sudoku'

const STORAGE_KEY = 'sudoku-records'
const MAX_RECORDS_PER_DIFFICULTY = 3

export const useRecordsStore = defineStore('records', () => {
  // State
  const records = ref<GameRecord[]>([])

  // Load records from localStorage on initialization
  function loadRecords() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        records.value = JSON.parse(stored)
      } catch (e) {
        console.error('Failed to load records:', e)
        records.value = []
      }
    }
  }

  // Save records to localStorage
  function saveRecords() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))
  }

  // Get records for a specific difficulty, sorted by score
  function getRecordsByDifficulty(difficulty: Difficulty): GameRecord[] {
    return records.value
      .filter((record) => record.difficulty === difficulty)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RECORDS_PER_DIFFICULTY)
  }

  // Check if a score qualifies for the leaderboard
  function isHighScore(score: number, difficulty: Difficulty): boolean {
    const difficultyRecords = getRecordsByDifficulty(difficulty)

    if (difficultyRecords.length < MAX_RECORDS_PER_DIFFICULTY) {
      return true
    }

    return score >= difficultyRecords[difficultyRecords.length - 1].score
  }

  // Add a new record
  function addRecord(record: Omit<GameRecord, 'id' | 'date'>) {
    const newRecord: GameRecord = {
      ...record,
      id: crypto.randomUUID(),
      date: Date.now(),
    }

    records.value.push(newRecord)

    // Keep only top records per difficulty
    const difficulties: Difficulty[] = ['beginner', 'intermediate', 'hard', 'expert']
    const newRecords: GameRecord[] = []

    for (const diff of difficulties) {
      const topRecords = getRecordsByDifficulty(diff)
      newRecords.push(...topRecords)
    }

    records.value = newRecords
    saveRecords()

    return newRecord
  }

  // Get all records grouped by difficulty
  const recordsByDifficulty = computed(() => {
    const grouped: Record<Difficulty, GameRecord[]> = {
      beginner: [],
      intermediate: [],
      hard: [],
      expert: [],
    }

    const difficulties: Difficulty[] = ['beginner', 'intermediate', 'hard', 'expert']

    for (const diff of difficulties) {
      grouped[diff] = getRecordsByDifficulty(diff)
    }

    return grouped
  })

  // Get the highest score for each difficulty
  const topScores = computed(() => {
    const scores: Record<Difficulty, number> = {
      beginner: 0,
      intermediate: 0,
      hard: 0,
      expert: 0,
    }

    const difficulties: Difficulty[] = ['beginner', 'intermediate', 'hard', 'expert']

    for (const diff of difficulties) {
      const records = getRecordsByDifficulty(diff)
      if (records.length > 0) {
        scores[diff] = records[0].score
      }
    }

    return scores
  })

  // Clear all records (for testing/debugging)
  function clearRecords() {
    records.value = []
    saveRecords()
  }

  // Initialize on store creation
  loadRecords()

  return {
    records,
    recordsByDifficulty,
    topScores,
    getRecordsByDifficulty,
    isHighScore,
    addRecord,
    clearRecords,
  }
})
