import { describe, it, expect, beforeEach } from 'vitest'
import { SudokuValidator } from '../sudokuValidator'
import { SudokuGenerator } from '../sudokuGenerator'
import { GRID_SIZE } from '@/types/sudoku'
import type { Cell } from '@/types/sudoku'

describe('SudokuValidator', () => {
  let board: Cell[][]

  beforeEach(() => {
    // Create an empty board
    board = []
    for (let row = 0; row < GRID_SIZE; row++) {
      board[row] = []
      for (let col = 0; col < GRID_SIZE; col++) {
        board[row][col] = {
          value: null,
          isInitial: false,
          isError: false,
          isDraft: false,
          row,
          col,
          block: SudokuGenerator.getBlockIndex(row, col),
          hasScored: false,
        }
      }
    }
  })

  describe('validateMove', () => {
    it('should allow valid moves', () => {
      const result = SudokuValidator.validateMove(board, 0, 0, 5)
      expect(result.isValid).toBe(true)
      expect(result.conflicts).toHaveLength(0)
    })

    it('should detect row conflicts', () => {
      board[0][3].value = 5
      const result = SudokuValidator.validateMove(board, 0, 0, 5)
      expect(result.isValid).toBe(false)
      expect(result.conflicts).toContainEqual({ row: 0, col: 3 })
    })

    it('should detect column conflicts', () => {
      board[3][0].value = 5
      const result = SudokuValidator.validateMove(board, 0, 0, 5)
      expect(result.isValid).toBe(false)
      expect(result.conflicts).toContainEqual({ row: 3, col: 0 })
    })

    it('should detect block conflicts', () => {
      board[1][1].value = 5
      const result = SudokuValidator.validateMove(board, 0, 0, 5)
      expect(result.isValid).toBe(false)
      expect(result.conflicts).toContainEqual({ row: 1, col: 1 })
    })

    it('should detect multiple conflicts', () => {
      board[0][5].value = 5 // Row conflict
      board[5][0].value = 5 // Column conflict
      board[2][2].value = 5 // Block conflict

      const result = SudokuValidator.validateMove(board, 0, 0, 5)
      expect(result.isValid).toBe(false)
      expect(result.conflicts).toHaveLength(3)
    })
  })

  describe('isBoardValid', () => {
    it('should return true for empty board', () => {
      expect(SudokuValidator.isBoardValid(board)).toBe(true)
    })

    it('should return true for valid partial board', () => {
      board[0][0].value = 1
      board[0][1].value = 2
      board[1][0].value = 3
      board[1][1].value = 4

      expect(SudokuValidator.isBoardValid(board)).toBe(true)
    })

    it('should return false for invalid board', () => {
      board[0][0].value = 5
      board[0][1].value = 5 // Duplicate in row

      expect(SudokuValidator.isBoardValid(board)).toBe(false)
    })
  })

  describe('isBoardComplete', () => {
    it('should return false for incomplete board', () => {
      expect(SudokuValidator.isBoardComplete(board)).toBe(false)
    })

    it('should return true for complete valid board', () => {
      // Generate a complete solution
      const solution = SudokuGenerator.generateSolution()

      // Fill the board
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          board[row][col].value = solution[row][col]
        }
      }

      expect(SudokuValidator.isBoardComplete(board)).toBe(true)
    })
  })

  describe('isRowComplete', () => {
    it('should return false for incomplete row', () => {
      expect(SudokuValidator.isRowComplete(board, 0)).toBe(false)
    })

    it('should return true for complete valid row', () => {
      for (let col = 0; col < GRID_SIZE; col++) {
        board[0][col].value = col + 1
      }
      expect(SudokuValidator.isRowComplete(board, 0)).toBe(true)
    })

    it('should return false for row with duplicates', () => {
      for (let col = 0; col < GRID_SIZE; col++) {
        board[0][col].value = 1 // All same value
      }
      expect(SudokuValidator.isRowComplete(board, 0)).toBe(false)
    })
  })

  describe('isColumnComplete', () => {
    it('should return false for incomplete column', () => {
      expect(SudokuValidator.isColumnComplete(board, 0)).toBe(false)
    })

    it('should return true for complete valid column', () => {
      for (let row = 0; row < GRID_SIZE; row++) {
        board[row][0].value = row + 1
      }
      expect(SudokuValidator.isColumnComplete(board, 0)).toBe(true)
    })
  })

  describe('isBlockComplete', () => {
    it('should return false for incomplete block', () => {
      expect(SudokuValidator.isBlockComplete(board, 0)).toBe(false)
    })

    it('should return true for complete valid block', () => {
      // Fill the top-left block with values 1-9
      let value = 1
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          board[row][col].value = value++
        }
      }
      expect(SudokuValidator.isBlockComplete(board, 0)).toBe(true)
    })
  })

  describe('getDigitCounts', () => {
    it('should return correct counts for empty board', () => {
      const counts = SudokuValidator.getDigitCounts(board)

      for (let i = 1; i <= GRID_SIZE; i++) {
        expect(counts.get(i)).toBe(0)
      }
    })

    it('should return correct counts for partially filled board', () => {
      board[0][0].value = 1
      board[0][1].value = 1
      board[0][2].value = 2
      board[0][3].value = 3
      board[0][4].value = 3
      board[0][5].value = 3

      const counts = SudokuValidator.getDigitCounts(board)

      expect(counts.get(1)).toBe(2)
      expect(counts.get(2)).toBe(1)
      expect(counts.get(3)).toBe(3)
      expect(counts.get(4)).toBe(0)
    })
  })

  describe('findValidCellsForValue', () => {
    it('should find all valid cells for a value on empty board', () => {
      const validCells = SudokuValidator.findValidCellsForValue(board, 5)
      expect(validCells).toHaveLength(81) // All cells are valid
    })

    it('should exclude cells with conflicts', () => {
      board[0][0].value = 5

      const validCells = SudokuValidator.findValidCellsForValue(board, 5)

      // Should not include cells in same row, column, or block
      expect(validCells).not.toContainEqual({ row: 0, col: 0 }) // The cell itself
      expect(validCells).not.toContainEqual({ row: 0, col: 5 }) // Same row
      expect(validCells).not.toContainEqual({ row: 5, col: 0 }) // Same column
      expect(validCells).not.toContainEqual({ row: 1, col: 1 }) // Same block

      // Should include cells in different row, column, and block
      expect(validCells).toContainEqual({ row: 3, col: 3 })
    })
  })
})
