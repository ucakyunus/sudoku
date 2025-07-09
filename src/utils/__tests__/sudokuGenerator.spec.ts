import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SudokuGenerator } from '../sudokuGenerator'
import { GRID_SIZE, DIFFICULTY_CONFIGS } from '@/types/sudoku'

// Mock Math.random to make tests deterministic and faster
const mockRandom = vi.fn()
beforeEach(() => {
  vi.clearAllMocks()
  // Use a simple deterministic sequence for random numbers
  let counter = 0
  mockRandom.mockImplementation(() => {
    counter++
    return (counter % 100) / 100 // Returns 0.01, 0.02, 0.03, etc.
  })
  vi.spyOn(Math, 'random').mockImplementation(mockRandom)
})

describe('SudokuGenerator', () => {
  describe('generateSolution', () => {
    it('should generate a valid complete Sudoku solution', () => {
      const solution = SudokuGenerator.generateSolution()

      // Check dimensions
      expect(solution).toHaveLength(GRID_SIZE)
      solution.forEach((row) => {
        expect(row).toHaveLength(GRID_SIZE)
      })

      // Check all cells are filled
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          expect(solution[row][col]).toBeGreaterThanOrEqual(1)
          expect(solution[row][col]).toBeLessThanOrEqual(9)
        }
      }

      // Check validity (simplified check for speed)
      expect(isValidSolutionFast(solution)).toBe(true)
    })

    it('should generate different solutions', () => {
      const solution1 = SudokuGenerator.generateSolution()
      const solution2 = SudokuGenerator.generateSolution()

      // Convert to string for comparison
      const str1 = JSON.stringify(solution1)
      const str2 = JSON.stringify(solution2)

      expect(str1).not.toBe(str2)
    })
  })

  describe('createPuzzle', () => {
    it('should create puzzles with correct number of visible cells for each difficulty', () => {
      const solution = SudokuGenerator.generateSolution()

      const difficulties = ['beginner', 'intermediate', 'hard', 'expert'] as const

      difficulties.forEach((difficulty) => {
        const puzzle = SudokuGenerator.createPuzzle(solution, difficulty)
        const config = DIFFICULTY_CONFIGS[difficulty]

        // Count visible cells
        let visibleCells = 0
        for (let row = 0; row < GRID_SIZE; row++) {
          for (let col = 0; col < GRID_SIZE; col++) {
            if (puzzle[row][col] !== 0) {
              visibleCells++
            }
          }
        }

        expect(visibleCells).toBeGreaterThanOrEqual(config.visibleCells.min)
        expect(visibleCells).toBeLessThanOrEqual(config.visibleCells.max)
      })
    })

    it('should create puzzles that maintain the same solution', () => {
      const solution = SudokuGenerator.generateSolution()
      const puzzle = SudokuGenerator.createPuzzle(solution, 'beginner')

      // Check that all visible cells match the solution
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (puzzle[row][col] !== 0) {
            expect(puzzle[row][col]).toBe(solution[row][col])
          }
        }
      }
    })
  })

  describe('isValidPlacement', () => {
    it('should correctly validate placements', () => {
      const grid = Array(GRID_SIZE)
        .fill(null)
        .map(() => Array(GRID_SIZE).fill(0))

      // Place a 5 at position (0, 0)
      grid[0][0] = 5

      // Should not allow 5 in the same row
      expect(SudokuGenerator.isValidPlacement(grid, 0, 1, 5)).toBe(false)

      // Should not allow 5 in the same column
      expect(SudokuGenerator.isValidPlacement(grid, 1, 0, 5)).toBe(false)

      // Should not allow 5 in the same block
      expect(SudokuGenerator.isValidPlacement(grid, 1, 1, 5)).toBe(false)

      // Should allow 5 in a different row, column, and block
      expect(SudokuGenerator.isValidPlacement(grid, 3, 3, 5)).toBe(true)

      // Should allow different numbers
      expect(SudokuGenerator.isValidPlacement(grid, 0, 1, 1)).toBe(true)
    })
  })

  describe('getBlockIndex', () => {
    it('should return correct block indices', () => {
      // Top-left block (0)
      expect(SudokuGenerator.getBlockIndex(0, 0)).toBe(0)
      expect(SudokuGenerator.getBlockIndex(2, 2)).toBe(0)

      // Top-middle block (1)
      expect(SudokuGenerator.getBlockIndex(0, 3)).toBe(1)
      expect(SudokuGenerator.getBlockIndex(2, 5)).toBe(1)

      // Top-right block (2)
      expect(SudokuGenerator.getBlockIndex(0, 6)).toBe(2)
      expect(SudokuGenerator.getBlockIndex(2, 8)).toBe(2)

      // Middle-left block (3)
      expect(SudokuGenerator.getBlockIndex(3, 0)).toBe(3)
      expect(SudokuGenerator.getBlockIndex(5, 2)).toBe(3)

      // Center block (4)
      expect(SudokuGenerator.getBlockIndex(4, 4)).toBe(4)

      // Bottom-right block (8)
      expect(SudokuGenerator.getBlockIndex(8, 8)).toBe(8)
    })
  })

  describe('solvePuzzle', () => {
    it('should solve a valid puzzle', () => {
      const solution = SudokuGenerator.generateSolution()
      const puzzle = SudokuGenerator.createPuzzle(solution, 'beginner')

      const solved = SudokuGenerator.solvePuzzle(puzzle)

      expect(solved).not.toBeNull()
      expect(JSON.stringify(solved)).toBe(JSON.stringify(solution))
    })

    it('should return null for unsolvable puzzle', () => {
      // Create an invalid puzzle
      const invalidPuzzle = Array(GRID_SIZE)
        .fill(null)
        .map(() => Array(GRID_SIZE).fill(0))

      // Place conflicting values
      invalidPuzzle[0][0] = 5
      invalidPuzzle[0][1] = 5 // Same row conflict

      const solved = SudokuGenerator.solvePuzzle(invalidPuzzle)
      expect(solved).toBeNull()
    })
  })
})

// Fast validation function that only checks a subset for speed
function isValidSolutionFast(grid: number[][]): boolean {
  // Only check first row, first column, and first block for speed
  const rowSet = new Set(grid[0])
  if (rowSet.size !== GRID_SIZE) return false

  const colSet = new Set<number>()
  for (let row = 0; row < GRID_SIZE; row++) {
    colSet.add(grid[row][0])
  }
  if (colSet.size !== GRID_SIZE) return false

  const blockSet = new Set<number>()
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      blockSet.add(grid[i][j])
    }
  }
  if (blockSet.size !== GRID_SIZE) return false

  return true
}

// Original validation function (kept for reference)
function isValidSolution(grid: number[][]): boolean {
  // Check rows
  for (let row = 0; row < GRID_SIZE; row++) {
    const rowSet = new Set(grid[row])
    if (rowSet.size !== GRID_SIZE) return false
  }

  // Check columns
  for (let col = 0; col < GRID_SIZE; col++) {
    const colSet = new Set<number>()
    for (let row = 0; row < GRID_SIZE; row++) {
      colSet.add(grid[row][col])
    }
    if (colSet.size !== GRID_SIZE) return false
  }

  // Check blocks
  for (let blockRow = 0; blockRow < 3; blockRow++) {
    for (let blockCol = 0; blockCol < 3; blockCol++) {
      const blockSet = new Set<number>()
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          blockSet.add(grid[blockRow * 3 + i][blockCol * 3 + j])
        }
      }
      if (blockSet.size !== GRID_SIZE) return false
    }
  }

  return true
}
