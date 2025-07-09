import { GRID_SIZE, BLOCK_SIZE, DIFFICULTY_CONFIGS, type Difficulty } from '@/types/sudoku'

export class SudokuGenerator {
  /**
   * Generate a complete valid Sudoku solution
   */
  static generateSolution(): number[][] {
    const grid: number[][] = []
    for (let i = 0; i < GRID_SIZE; i++) {
      grid[i] = []
      for (let j = 0; j < GRID_SIZE; j++) {
        grid[i][j] = 0
      }
    }
    this.fillGrid(grid)
    return grid
  }

  /**
   * Fill the grid using backtracking algorithm
   */
  private static fillGrid(grid: number[][]): boolean {
    const emptyCell = this.findEmptyCell(grid)
    if (!emptyCell) return true

    const [row, col] = emptyCell
    const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9])

    for (const num of numbers) {
      if (this.isValidPlacement(grid, row, col, num)) {
        grid[row][col] = num

        if (this.fillGrid(grid)) {
          return true
        }

        grid[row][col] = 0
      }
    }

    return false
  }

  /**
   * Find the next empty cell in the grid
   */
  private static findEmptyCell(grid: number[][]): [number, number] | null {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col] === 0) {
          return [row, col]
        }
      }
    }
    return null
  }

  /**
   * Check if a number can be placed at a specific position
   */
  static isValidPlacement(grid: number[][], row: number, col: number, num: number): boolean {
    // Check row
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[row][x] === num) return false
    }

    // Check column
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[x][col] === num) return false
    }

    // Check 3x3 block
    const blockRow = Math.floor(row / BLOCK_SIZE) * BLOCK_SIZE
    const blockCol = Math.floor(col / BLOCK_SIZE) * BLOCK_SIZE

    for (let i = 0; i < BLOCK_SIZE; i++) {
      for (let j = 0; j < BLOCK_SIZE; j++) {
        if (grid[blockRow + i][blockCol + j] === num) return false
      }
    }

    return true
  }

  /**
   * Remove cells from a complete grid to create a puzzle
   */
  static createPuzzle(solution: number[][], difficulty: Difficulty): number[][] {
    const puzzle = solution.map((row) => [...row])
    const config = DIFFICULTY_CONFIGS[difficulty]
    const cellsToShow = this.randomInRange(config.visibleCells.min, config.visibleCells.max)
    const cellsToRemove = GRID_SIZE * GRID_SIZE - cellsToShow

    const positions = []
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        positions.push([row, col])
      }
    }

    const shuffledPositions = this.shuffleArray(positions)
    let removed = 0

    for (const [row, col] of shuffledPositions) {
      if (removed >= cellsToRemove) break

      const temp = puzzle[row][col]
      puzzle[row][col] = 0

      // Ensure the puzzle still has a unique solution
      const solutionCount = this.countSolutions(puzzle)
      if (solutionCount === 1) {
        removed++
      } else {
        puzzle[row][col] = temp
      }
    }

    return puzzle
  }

  /**
   * Count the number of solutions for a given puzzle
   */
  private static countSolutions(grid: number[][], count = 0): number {
    if (count > 1) return count

    const emptyCell = this.findEmptyCell(grid)
    if (!emptyCell) return count + 1

    const [row, col] = emptyCell

    for (let num = 1; num <= 9; num++) {
      if (this.isValidPlacement(grid, row, col, num)) {
        grid[row][col] = num
        count = this.countSolutions(grid, count)
        grid[row][col] = 0
      }
    }

    return count
  }

  /**
   * Solve a Sudoku puzzle
   */
  static solvePuzzle(puzzle: number[][]): number[][] | null {
    const solution = puzzle.map((row) => [...row])
    if (this.solve(solution)) {
      return solution
    }
    return null
  }

  /**
   * Solve using backtracking
   */
  private static solve(grid: number[][]): boolean {
    const emptyCell = this.findEmptyCell(grid)
    if (!emptyCell) return true

    const [row, col] = emptyCell

    for (let num = 1; num <= 9; num++) {
      if (this.isValidPlacement(grid, row, col, num)) {
        grid[row][col] = num

        if (this.solve(grid)) {
          return true
        }

        grid[row][col] = 0
      }
    }

    return false
  }

  /**
   * Utility functions
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  private static randomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  /**
   * Get the block index for a cell
   */
  static getBlockIndex(row: number, col: number): number {
    return Math.floor(row / BLOCK_SIZE) * BLOCK_SIZE + Math.floor(col / BLOCK_SIZE)
  }
}
