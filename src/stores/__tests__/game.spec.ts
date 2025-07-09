import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../game'
import { GRID_SIZE } from '@/types/sudoku'

// Mock the utility modules
vi.mock('@/utils/sudokuGenerator', () => ({
  SudokuGenerator: {
    generateSolution: vi.fn(() => {
      // Return a simple valid solution for testing
      const solution = Array(9)
        .fill(null)
        .map(() => Array(9).fill(0))
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          solution[i][j] = ((i * 3 + Math.floor(i / 3) + j) % 9) + 1
        }
      }
      return solution
    }),
    createPuzzle: vi.fn((solution) => {
      // Create a simple puzzle with some cells filled
      const puzzle = solution.map((row: number[]) => [...row])
      // Fill only first few cells for testing
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          puzzle[i][j] = solution[i][j]
        }
      }
      // Clear the rest
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (i >= 3 || j >= 3) {
            puzzle[i][j] = 0
          }
        }
      }
      return puzzle
    }),
    getBlockIndex: vi.fn((row, col) => Math.floor(row / 3) * 3 + Math.floor(col / 3)),
  },
}))

const mockSudokuValidator = {
  validateMove: vi.fn(() => {
    // Simple validation - always valid for testing
    return { isValid: true, conflicts: [] }
  }),
  isRowComplete: vi.fn(() => false),
  isColumnComplete: vi.fn(() => false),
  isBlockComplete: vi.fn(() => false),
  isBoardComplete: vi.fn(() => false),
  getDigitCounts: vi.fn(() => new Map()),
}

vi.mock('@/utils/sudokuValidator', () => ({
  SudokuValidator: mockSudokuValidator,
}))

describe('Game Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should start a new game with correct initial state', () => {
      const store = useGameStore()

      store.startNewGame('beginner')

      expect(store.difficulty).toBe('beginner')
      expect(store.isPaused).toBe(false)
      expect(store.isCompleted).toBe(false)
      expect(store.hintsUsed).toBe(0)
      expect(store.errors).toBe(0)
      expect(store.score).toBe(0)
      expect(store.moveHistory).toEqual([])
      expect(store.selectedCell).toBeNull()
      expect(store.startTime).toBeGreaterThan(0)
      expect(store.endTime).toBeNull()
      expect(store.pausedTime).toBe(0)
    })

    it('should initialize board correctly', () => {
      const store = useGameStore()

      store.initializeBoard()

      expect(store.board).toHaveLength(GRID_SIZE)
      expect(store.board[0]).toHaveLength(GRID_SIZE)

      // Check that all cells are properly initialized
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const cell = store.board[row][col]
          expect(cell.value).toBeNull()
          expect(cell.isInitial).toBe(false)
          expect(cell.isError).toBe(false)
          expect(cell.isDraft).toBe(false)
          expect(cell.row).toBe(row)
          expect(cell.col).toBe(col)
          expect(cell.hasScored).toBe(false)
        }
      }
    })
  })

  describe('Cell Selection', () => {
    it('should select a cell correctly', () => {
      const store = useGameStore()
      store.startNewGame('beginner')

      store.selectCell(2, 3)

      expect(store.selectedCell).toEqual({ row: 2, col: 3 })
    })

    it('should clear selection correctly', () => {
      const store = useGameStore()
      store.startNewGame('beginner')
      store.selectCell(2, 3)

      store.clearSelection()

      expect(store.selectedCell).toBeNull()
    })
  })

  describe('Cell Value Management', () => {
    it('should set cell value correctly', () => {
      const store = useGameStore()
      store.startNewGame('beginner')

      store.setCellValue(3, 4, 5)

      expect(store.board[3][4].value).toBe(5)
      expect(store.board[3][4].isDraft).toBe(false)
      expect(store.moveHistory).toHaveLength(1)
    })

    it('should set draft value correctly', () => {
      const store = useGameStore()
      store.startNewGame('beginner')

      store.setCellValue(3, 4, 5, true)

      expect(store.board[3][4].value).toBe(5)
      expect(store.board[3][4].isDraft).toBe(true)
    })

    it('should not allow setting value on initial cells', () => {
      const store = useGameStore()
      store.startNewGame('beginner')

      // Set a cell as initial
      store.board[0][0].isInitial = true
      store.board[0][0].value = 1

      store.setCellValue(0, 0, 5)

      expect(store.board[0][0].value).toBe(1) // Should remain unchanged
    })

    it('should clear errors when setting new value', () => {
      const store = useGameStore()
      store.startNewGame('beginner')

      // Set an error manually
      store.board[0][0].isError = true

      // Set a value on a different cell - this should clear all errors
      store.setCellValue(3, 3, 5)

      expect(store.board[0][0].isError).toBe(false)
    })
  })

  describe('Move History', () => {
    it('should track user moves correctly', () => {
      const store = useGameStore()
      store.startNewGame('beginner')

      store.setCellValue(3, 3, 5)
      store.setCellValue(4, 4, 3)

      expect(store.hasUserMoves()).toBe(true)
      expect(store.moveHistory).toHaveLength(2)
      expect(store.moveHistory[0]).toEqual({
        row: 3,
        col: 3,
        oldValue: null,
        newValue: 5,
      })
    })

    it('should not have user moves on fresh game', () => {
      const store = useGameStore()
      store.startNewGame('beginner')

      expect(store.hasUserMoves()).toBe(false)
      expect(store.moveHistory).toEqual([])
    })
  })

  describe('Undo Functionality', () => {
    it('should undo last move correctly', () => {
      const store = useGameStore()
      store.startNewGame('beginner')

      store.setCellValue(3, 3, 5)
      store.setCellValue(4, 4, 3)

      expect(store.moveHistory).toHaveLength(2)

      store.undo()

      expect(store.moveHistory).toHaveLength(1)
      expect(store.board[4][4].value).toBeNull()
      expect(store.board[4][4].isDraft).toBe(false)
      expect(store.board[4][4].isError).toBe(false)
    })

    it('should not undo when no moves exist', () => {
      const store = useGameStore()
      store.startNewGame('beginner')

      store.undo()

      expect(store.moveHistory).toEqual([])
    })
  })

  describe('Hint System', () => {
    it('should use hint correctly when cell is selected', () => {
      const store = useGameStore()
      store.startNewGame('beginner')
      store.selectCell(3, 4)

      const result = store.useHint()

      expect(result).toBeDefined()
      expect(store.hintsUsed).toBe(1)
      expect(store.hintsRemaining).toBe(9) // MAX_HINTS - 1
    })

    it('should not use hint when no cell is selected', () => {
      const store = useGameStore()
      store.startNewGame('beginner')

      const result = store.useHint()

      expect(result).toBeNull()
      expect(store.hintsUsed).toBe(0)
    })

    it('should not use hint when hints are exhausted', () => {
      const store = useGameStore()
      store.startNewGame('beginner')
      store.hintsUsed = 10 // MAX_HINTS
      store.selectCell(3, 4)

      const result = store.useHint()

      expect(result).toBeNull()
      expect(store.hintsUsed).toBe(10)
    })

    it('should not use hint on initial cells', () => {
      const store = useGameStore()
      store.startNewGame('beginner')
      store.board[0][0].isInitial = true
      store.selectCell(0, 0)

      const result = store.useHint()

      expect(result).toBeNull()
    })
  })

  describe('Pause Functionality', () => {
    it('should toggle pause correctly', () => {
      const store = useGameStore()
      store.startNewGame('beginner')

      expect(store.isPaused).toBe(false)

      store.togglePause()

      expect(store.isPaused).toBe(true)
      expect(store.pausedTime).toBeGreaterThanOrEqual(0)

      store.togglePause()

      expect(store.isPaused).toBe(false)
      expect(store.pausedTime).toBe(0)
    })

    it('should not pause when game is completed', () => {
      const store = useGameStore()
      store.startNewGame('beginner')
      store.isCompleted = true

      store.togglePause()

      expect(store.isPaused).toBe(false)
    })
  })

  describe('Scoring System', () => {
    it('should update score correctly', () => {
      const store = useGameStore()
      store.startNewGame('beginner')

      store.updateScore(10)
      expect(store.score).toBe(10)

      store.updateScore(5)
      expect(store.score).toBe(15)
    })

    it('should not allow negative score', () => {
      const store = useGameStore()
      store.startNewGame('beginner')
      store.score = 5

      store.updateScore(-10)

      expect(store.score).toBe(0)
    })

    it('should calculate final score correctly', () => {
      const store = useGameStore()
      store.startNewGame('beginner')
      store.score = 100

      const finalScore = store.calculateFinalScore()

      expect(finalScore).toBeGreaterThanOrEqual(100)
    })
  })

  describe('Game Completion', () => {
    it('should check completion correctly', () => {
      const store = useGameStore()
      store.startNewGame('beginner')

      // Mock the validator to return complete
      mockSudokuValidator.isBoardComplete.mockReturnValue(true)

      store.checkCompletion()

      expect(store.isCompleted).toBe(true)
      expect(store.endTime).toBeGreaterThan(0)
    })
  })

  describe('Completed Elements Tracking', () => {
    it('should get completed rows correctly', () => {
      const store = useGameStore()
      store.startNewGame('beginner')
      store.recentlyCompletedRows.add(2)

      const completedRows = store.getCompletedRows()

      expect(completedRows).toEqual([2])
    })

    it('should get completed columns correctly', () => {
      const store = useGameStore()
      store.startNewGame('beginner')
      store.recentlyCompletedColumns.add(3)

      const completedColumns = store.getCompletedColumns()

      expect(completedColumns).toEqual([3])
    })

    it('should get completed blocks correctly', () => {
      const store = useGameStore()
      store.startNewGame('beginner')
      store.recentlyCompletedBlocks.add(1)

      const completedBlocks = store.getCompletedBlocks()

      expect(completedBlocks).toEqual([1])
    })
  })

  describe('Error Management', () => {
    it('should clear errors correctly', () => {
      const store = useGameStore()
      store.startNewGame('beginner')

      // Set some errors
      store.board[0][0].isError = true
      store.board[1][1].isError = true

      store.clearErrors()

      // Check that all errors are cleared
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          expect(store.board[row][col].isError).toBe(false)
        }
      }
    })
  })

  describe('Computed Properties', () => {
    it('should calculate hints remaining correctly', () => {
      const store = useGameStore()
      store.startNewGame('beginner')
      store.hintsUsed = 3

      expect(store.hintsRemaining).toBe(7) // MAX_HINTS - 3
    })

    it('should calculate elapsed time correctly', () => {
      const store = useGameStore()
      store.startNewGame('beginner')

      expect(store.elapsedTime).toBeGreaterThanOrEqual(0)
    })

    it('should calculate elapsed time when paused', () => {
      const store = useGameStore()
      store.startNewGame('beginner')
      store.isPaused = true
      store.pausedTime = 30

      expect(store.elapsedTime).toBe(30)
    })

    it('should provide game state correctly', () => {
      const store = useGameStore()
      store.startNewGame('beginner')

      const gameState = store.gameState

      expect(gameState.board).toBe(store.board)
      expect(gameState.solution).toBe(store.solution)
      expect(gameState.difficulty).toBe(store.difficulty)
      expect(gameState.isPaused).toBe(store.isPaused)
      expect(gameState.isCompleted).toBe(store.isCompleted)
      expect(gameState.hintsUsed).toBe(store.hintsUsed)
      expect(gameState.hintsRemaining).toBe(store.hintsRemaining)
      expect(gameState.errors).toBe(store.errors)
      expect(gameState.score).toBe(store.score)
      expect(gameState.selectedCell).toBe(store.selectedCell)
    })
  })
})
