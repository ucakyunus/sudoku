import { GRID_SIZE, BLOCK_SIZE, type Cell, type ValidationResult } from '@/types/sudoku'

export class SudokuValidator {
  /**
   * Validate a move and return conflicts if any
   */
  static validateMove(board: Cell[][], row: number, col: number, value: number): ValidationResult {
    const conflicts: Array<{ row: number; col: number }> = []

    // Check row conflicts
    for (let c = 0; c < GRID_SIZE; c++) {
      if (c !== col && board[row][c].value === value) {
        conflicts.push({ row, col: c })
      }
    }

    // Check column conflicts
    for (let r = 0; r < GRID_SIZE; r++) {
      if (r !== row && board[r][col].value === value) {
        conflicts.push({ row: r, col })
      }
    }

    // Check block conflicts
    const blockRow = Math.floor(row / BLOCK_SIZE) * BLOCK_SIZE
    const blockCol = Math.floor(col / BLOCK_SIZE) * BLOCK_SIZE

    for (let r = blockRow; r < blockRow + BLOCK_SIZE; r++) {
      for (let c = blockCol; c < blockCol + BLOCK_SIZE; c++) {
        if (r !== row && c !== col && board[r][c].value === value) {
          conflicts.push({ row: r, col: c })
        }
      }
    }

    return {
      isValid: conflicts.length === 0,
      conflicts,
    }
  }

  /**
   * Check if the entire board is valid
   */
  static isBoardValid(board: Cell[][]): boolean {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cell = board[row][col]
        if (cell.value !== null) {
          // Temporarily remove the value to check if it's valid
          const tempValue = cell.value
          cell.value = null
          const validation = this.validateMove(board, row, col, tempValue)
          cell.value = tempValue

          if (!validation.isValid) {
            return false
          }
        }
      }
    }
    return true
  }

  /**
   * Check if the board is complete and valid
   */
  static isBoardComplete(board: Cell[][]): boolean {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (board[row][col].value === null) {
          return false
        }
      }
    }
    return this.isBoardValid(board)
  }

  /**
   * Check if a specific row is complete
   */
  static isRowComplete(board: Cell[][], row: number): boolean {
    const values = new Set<number>()
    for (let col = 0; col < GRID_SIZE; col++) {
      const value = board[row][col].value
      if (value === null || values.has(value)) {
        return false
      }
      values.add(value)
    }
    return values.size === GRID_SIZE
  }

  /**
   * Check if a specific column is complete
   */
  static isColumnComplete(board: Cell[][], col: number): boolean {
    const values = new Set<number>()
    for (let row = 0; row < GRID_SIZE; row++) {
      const value = board[row][col].value
      if (value === null || values.has(value)) {
        return false
      }
      values.add(value)
    }
    return values.size === GRID_SIZE
  }

  /**
   * Check if a specific block is complete
   */
  static isBlockComplete(board: Cell[][], blockIndex: number): boolean {
    const values = new Set<number>()
    const blockRow = Math.floor(blockIndex / BLOCK_SIZE) * BLOCK_SIZE
    const blockCol = (blockIndex % BLOCK_SIZE) * BLOCK_SIZE

    for (let r = blockRow; r < blockRow + BLOCK_SIZE; r++) {
      for (let c = blockCol; c < blockCol + BLOCK_SIZE; c++) {
        const value = board[r][c].value
        if (value === null || values.has(value)) {
          return false
        }
        values.add(value)
      }
    }
    return values.size === GRID_SIZE
  }

  /**
   * Get count of each digit on the board
   */
  static getDigitCounts(board: Cell[][]): Map<number, number> {
    const counts = new Map<number, number>()

    // Initialize counts for all digits
    for (let i = 1; i <= GRID_SIZE; i++) {
      counts.set(i, 0)
    }

    // Count occurrences
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const value = board[row][col].value
        if (value !== null) {
          counts.set(value, (counts.get(value) || 0) + 1)
        }
      }
    }

    return counts
  }

  /**
   * Find cells that can potentially hold a specific value
   */
  static findValidCellsForValue(
    board: Cell[][],
    value: number,
  ): Array<{ row: number; col: number }> {
    const validCells: Array<{ row: number; col: number }> = []

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (board[row][col].value === null) {
          const validation = this.validateMove(board, row, col, value)
          if (validation.isValid) {
            validCells.push({ row, col })
          }
        }
      }
    }

    return validCells
  }
}
