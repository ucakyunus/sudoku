import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRecordsStore } from '../records'
import type { GameRecord, Difficulty } from '@/types/sudoku'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock crypto.randomUUID
const mockUUID = 'test-uuid-123'
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => mockUUID),
  },
})

describe('Records Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  describe('Initialization', () => {
    it('should initialize with empty records when no localStorage data', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const store = useRecordsStore()

      expect(store.records).toEqual([])
      expect(localStorageMock.getItem).toHaveBeenCalledWith('sudoku-records')
    })

    it('should load records from localStorage on initialization', () => {
      const mockRecords: GameRecord[] = [
        {
          id: '1',
          playerName: 'Player1',
          score: 100,
          difficulty: 'beginner',
          time: 120,
          date: Date.now(),
          hintsUsed: 2,
          errors: 1,
        },
        {
          id: '2',
          playerName: 'Player2',
          score: 150,
          difficulty: 'intermediate',
          time: 180,
          date: Date.now(),
          hintsUsed: 1,
          errors: 0,
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockRecords))

      const store = useRecordsStore()

      expect(store.records).toEqual(mockRecords)
      expect(localStorageMock.getItem).toHaveBeenCalledWith('sudoku-records')
    })

    it('should handle invalid JSON in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json')
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const store = useRecordsStore()

      expect(store.records).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load records:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe('Record Management', () => {
    it('should add a new record correctly', () => {
      const store = useRecordsStore()
      const newRecord = {
        playerName: 'TestPlayer',
        score: 200,
        difficulty: 'beginner' as Difficulty,
        time: 150,
        hintsUsed: 3,
        errors: 2,
      }

      const result = store.addRecord(newRecord)

      expect(result).toEqual({
        ...newRecord,
        id: mockUUID,
        date: expect.any(Number),
      })
      expect(store.records).toHaveLength(1)
      expect(store.records[0]).toEqual(result)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'sudoku-records',
        JSON.stringify(store.records),
      )
    })

    it('should maintain only top 3 records per difficulty', () => {
      const store = useRecordsStore()

      // Add 4 records for beginner difficulty
      const records = [
        {
          playerName: 'Player1',
          score: 100,
          difficulty: 'beginner' as Difficulty,
          time: 120,
          hintsUsed: 0,
          errors: 0,
        },
        {
          playerName: 'Player2',
          score: 150,
          difficulty: 'beginner' as Difficulty,
          time: 180,
          hintsUsed: 1,
          errors: 1,
        },
        {
          playerName: 'Player3',
          score: 200,
          difficulty: 'beginner' as Difficulty,
          time: 200,
          hintsUsed: 2,
          errors: 2,
        },
        {
          playerName: 'Player4',
          score: 50,
          difficulty: 'beginner' as Difficulty,
          time: 100,
          hintsUsed: 3,
          errors: 3,
        },
      ]

      records.forEach((record) => store.addRecord(record))

      const beginnerRecords = store.getRecordsByDifficulty('beginner')
      expect(beginnerRecords).toHaveLength(3)
      expect(beginnerRecords[0].score).toBe(200) // Highest score first
      expect(beginnerRecords[1].score).toBe(150)
      expect(beginnerRecords[2].score).toBe(100) // Lowest score last
    })

    it('should clear all records correctly', () => {
      const store = useRecordsStore()
      store.addRecord({
        playerName: 'TestPlayer',
        score: 100,
        difficulty: 'beginner',
        time: 120,
        hintsUsed: 0,
        errors: 0,
      })

      expect(store.records).toHaveLength(1)

      store.clearRecords()

      expect(store.records).toEqual([])
      expect(localStorageMock.setItem).toHaveBeenCalledWith('sudoku-records', '[]')
    })
  })

  describe('Record Retrieval', () => {
    it('should get records by difficulty correctly', () => {
      const store = useRecordsStore()
      const records = [
        {
          playerName: 'Player1',
          score: 100,
          difficulty: 'beginner' as Difficulty,
          time: 120,
          hintsUsed: 0,
          errors: 0,
        },
        {
          playerName: 'Player2',
          score: 150,
          difficulty: 'intermediate' as Difficulty,
          time: 180,
          hintsUsed: 1,
          errors: 1,
        },
        {
          playerName: 'Player3',
          score: 200,
          difficulty: 'beginner' as Difficulty,
          time: 200,
          hintsUsed: 2,
          errors: 2,
        },
        {
          playerName: 'Player4',
          score: 250,
          difficulty: 'hard' as Difficulty,
          time: 250,
          hintsUsed: 3,
          errors: 3,
        },
      ]

      records.forEach((record) => store.addRecord(record))

      const beginnerRecords = store.getRecordsByDifficulty('beginner')
      const intermediateRecords = store.getRecordsByDifficulty('intermediate')
      const hardRecords = store.getRecordsByDifficulty('hard')
      const expertRecords = store.getRecordsByDifficulty('expert')

      expect(beginnerRecords).toHaveLength(2)
      expect(intermediateRecords).toHaveLength(1)
      expect(hardRecords).toHaveLength(1)
      expect(expertRecords).toHaveLength(0)

      // Check sorting (highest score first)
      expect(beginnerRecords[0].score).toBe(200)
      expect(beginnerRecords[1].score).toBe(100)
    })

    it('should return empty array for difficulty with no records', () => {
      const store = useRecordsStore()

      const expertRecords = store.getRecordsByDifficulty('expert')

      expect(expertRecords).toEqual([])
    })
  })

  describe('High Score Checking', () => {
    it('should identify high score when fewer than 3 records exist', () => {
      const store = useRecordsStore()
      store.addRecord({
        playerName: 'Player1',
        score: 100,
        difficulty: 'beginner',
        time: 120,
        hintsUsed: 0,
        errors: 0,
      })

      const isHighScore = store.isHighScore(50, 'beginner')

      expect(isHighScore).toBe(true)
    })

    it('should identify high score when score is higher than lowest existing score', () => {
      const store = useRecordsStore()
      const records = [
        {
          playerName: 'Player1',
          score: 300,
          difficulty: 'beginner' as Difficulty,
          time: 120,
          hintsUsed: 0,
          errors: 0,
        },
        {
          playerName: 'Player2',
          score: 200,
          difficulty: 'beginner' as Difficulty,
          time: 180,
          hintsUsed: 1,
          errors: 1,
        },
        {
          playerName: 'Player3',
          score: 100,
          difficulty: 'beginner' as Difficulty,
          time: 200,
          hintsUsed: 2,
          errors: 2,
        },
      ]

      records.forEach((record) => store.addRecord(record))

      const isHighScore = store.isHighScore(150, 'beginner')

      expect(isHighScore).toBe(true)
    })

    it('should not identify as high score when score is lower than lowest existing score', () => {
      const store = useRecordsStore()
      const records = [
        {
          playerName: 'Player1',
          score: 300,
          difficulty: 'beginner' as Difficulty,
          time: 120,
          hintsUsed: 0,
          errors: 0,
        },
        {
          playerName: 'Player2',
          score: 200,
          difficulty: 'beginner' as Difficulty,
          time: 180,
          hintsUsed: 1,
          errors: 1,
        },
        {
          playerName: 'Player3',
          score: 100,
          difficulty: 'beginner' as Difficulty,
          time: 200,
          hintsUsed: 2,
          errors: 2,
        },
      ]

      records.forEach((record) => store.addRecord(record))

      const isHighScore = store.isHighScore(50, 'beginner')

      expect(isHighScore).toBe(false)
    })

    it('should identify as high score when score equals lowest existing score', () => {
      const store = useRecordsStore()
      const records = [
        {
          playerName: 'Player1',
          score: 300,
          difficulty: 'beginner' as Difficulty,
          time: 120,
          hintsUsed: 0,
          errors: 0,
        },
        {
          playerName: 'Player2',
          score: 200,
          difficulty: 'beginner' as Difficulty,
          time: 180,
          hintsUsed: 1,
          errors: 1,
        },
        {
          playerName: 'Player3',
          score: 100,
          difficulty: 'beginner' as Difficulty,
          time: 200,
          hintsUsed: 2,
          errors: 2,
        },
      ]

      records.forEach((record) => store.addRecord(record))

      const isHighScore = store.isHighScore(100, 'beginner')

      expect(isHighScore).toBe(true)
    })
  })

  describe('Computed Properties', () => {
    it('should group records by difficulty correctly', () => {
      const store = useRecordsStore()
      const records = [
        {
          playerName: 'Player1',
          score: 100,
          difficulty: 'beginner' as Difficulty,
          time: 120,
          hintsUsed: 0,
          errors: 0,
        },
        {
          playerName: 'Player2',
          score: 150,
          difficulty: 'intermediate' as Difficulty,
          time: 180,
          hintsUsed: 1,
          errors: 1,
        },
        {
          playerName: 'Player3',
          score: 200,
          difficulty: 'beginner' as Difficulty,
          time: 200,
          hintsUsed: 2,
          errors: 2,
        },
        {
          playerName: 'Player4',
          score: 250,
          difficulty: 'hard' as Difficulty,
          time: 250,
          hintsUsed: 3,
          errors: 3,
        },
      ]

      records.forEach((record) => store.addRecord(record))

      const recordsByDifficulty = store.recordsByDifficulty

      expect(recordsByDifficulty.beginner).toHaveLength(2)
      expect(recordsByDifficulty.intermediate).toHaveLength(1)
      expect(recordsByDifficulty.hard).toHaveLength(1)
      expect(recordsByDifficulty.expert).toHaveLength(0)

      // Check sorting within each difficulty
      expect(recordsByDifficulty.beginner[0].score).toBe(200)
      expect(recordsByDifficulty.beginner[1].score).toBe(100)
    })

    it('should calculate top scores correctly', () => {
      const store = useRecordsStore()
      const records = [
        {
          playerName: 'Player1',
          score: 100,
          difficulty: 'beginner' as Difficulty,
          time: 120,
          hintsUsed: 0,
          errors: 0,
        },
        {
          playerName: 'Player2',
          score: 150,
          difficulty: 'intermediate' as Difficulty,
          time: 180,
          hintsUsed: 1,
          errors: 1,
        },
        {
          playerName: 'Player3',
          score: 200,
          difficulty: 'beginner' as Difficulty,
          time: 200,
          hintsUsed: 2,
          errors: 2,
        },
        {
          playerName: 'Player4',
          score: 250,
          difficulty: 'hard' as Difficulty,
          time: 250,
          hintsUsed: 3,
          errors: 3,
        },
      ]

      records.forEach((record) => store.addRecord(record))

      const topScores = store.topScores

      expect(topScores.beginner).toBe(200)
      expect(topScores.intermediate).toBe(150)
      expect(topScores.hard).toBe(250)
      expect(topScores.expert).toBe(0)
    })

    it('should return 0 for difficulties with no records', () => {
      const store = useRecordsStore()

      const topScores = store.topScores

      expect(topScores.beginner).toBe(0)
      expect(topScores.intermediate).toBe(0)
      expect(topScores.hard).toBe(0)
      expect(topScores.expert).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple difficulties with records', () => {
      const store = useRecordsStore()
      const records = [
        {
          playerName: 'Player1',
          score: 100,
          difficulty: 'beginner' as Difficulty,
          time: 120,
          hintsUsed: 0,
          errors: 0,
        },
        {
          playerName: 'Player2',
          score: 150,
          difficulty: 'intermediate' as Difficulty,
          time: 180,
          hintsUsed: 1,
          errors: 1,
        },
        {
          playerName: 'Player3',
          score: 200,
          difficulty: 'hard' as Difficulty,
          time: 200,
          hintsUsed: 2,
          errors: 2,
        },
        {
          playerName: 'Player4',
          score: 250,
          difficulty: 'expert' as Difficulty,
          time: 250,
          hintsUsed: 3,
          errors: 3,
        },
      ]

      records.forEach((record) => store.addRecord(record))

      expect(store.records).toHaveLength(4)
      expect(store.getRecordsByDifficulty('beginner')).toHaveLength(1)
      expect(store.getRecordsByDifficulty('intermediate')).toHaveLength(1)
      expect(store.getRecordsByDifficulty('hard')).toHaveLength(1)
      expect(store.getRecordsByDifficulty('expert')).toHaveLength(1)
    })

    it('should handle records with same score correctly', () => {
      const store = useRecordsStore()
      const records = [
        {
          playerName: 'Player1',
          score: 100,
          difficulty: 'beginner' as Difficulty,
          time: 120,
          hintsUsed: 0,
          errors: 0,
        },
        {
          playerName: 'Player2',
          score: 100,
          difficulty: 'beginner' as Difficulty,
          time: 180,
          hintsUsed: 1,
          errors: 1,
        },
        {
          playerName: 'Player3',
          score: 100,
          difficulty: 'beginner' as Difficulty,
          time: 200,
          hintsUsed: 2,
          errors: 2,
        },
        {
          playerName: 'Player4',
          score: 50,
          difficulty: 'beginner' as Difficulty,
          time: 250,
          hintsUsed: 3,
          errors: 3,
        },
      ]

      records.forEach((record) => store.addRecord(record))

      const beginnerRecords = store.getRecordsByDifficulty('beginner')
      expect(beginnerRecords).toHaveLength(3)
      expect(beginnerRecords[0].score).toBe(100)
      expect(beginnerRecords[1].score).toBe(100)
      expect(beginnerRecords[2].score).toBe(100)
    })

    it('should handle very high scores correctly', () => {
      const store = useRecordsStore()
      const highScoreRecord = {
        playerName: 'Champion',
        score: 999999,
        difficulty: 'expert' as Difficulty,
        time: 300,
        hintsUsed: 0,
        errors: 0,
      }

      store.addRecord(highScoreRecord)

      expect(store.topScores.expert).toBe(999999)
      expect(store.isHighScore(999998, 'expert')).toBe(true)
      expect(store.isHighScore(1000000, 'expert')).toBe(true)
    })
  })

  describe('Data Persistence', () => {
    it('should save records to localStorage when adding new record', () => {
      const store = useRecordsStore()
      const newRecord = {
        playerName: 'TestPlayer',
        score: 200,
        difficulty: 'beginner' as Difficulty,
        time: 150,
        hintsUsed: 3,
        errors: 2,
      }

      store.addRecord(newRecord)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'sudoku-records',
        JSON.stringify(store.records),
      )
    })

    it('should save records to localStorage when clearing records', () => {
      const store = useRecordsStore()
      store.addRecord({
        playerName: 'TestPlayer',
        score: 100,
        difficulty: 'beginner',
        time: 120,
        hintsUsed: 0,
        errors: 0,
      })

      store.clearRecords()

      expect(localStorageMock.setItem).toHaveBeenCalledWith('sudoku-records', '[]')
    })
  })
})
