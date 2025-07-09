import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Cell, Difficulty, GameState, HintResult } from '@/types/sudoku'
import { GRID_SIZE, MAX_HINTS, SCORING_CONFIG } from '@/types/sudoku'
import { SudokuGenerator } from '@/utils/sudokuGenerator'
import { SudokuValidator } from '@/utils/sudokuValidator'

export const useGameStore = defineStore('game', () => {
  // State
  const board = ref<Cell[][]>([])
  const solution = ref<number[][]>([])
  const difficulty = ref<Difficulty>('beginner')
  const startTime = ref<number>(0)
  const endTime = ref<number | null>(null)
  const isPaused = ref(false)
  const pausedTime = ref(0)
  const hintsUsed = ref(0)
  const errors = ref(0)
  const score = ref(0)
  const isCompleted = ref(false)
  const selectedCell = ref<{ row: number; col: number } | null>(null)
  const moveHistory = ref<
    Array<{ row: number; col: number; oldValue: number | null; newValue: number | null }>
  >([])

  // Animation state - only newly completed rows/cols/blocks
  const recentlyCompletedRows = ref<Set<number>>(new Set())
  const recentlyCompletedColumns = ref<Set<number>>(new Set())
  const recentlyCompletedBlocks = ref<Set<number>>(new Set())

  // Computed
  const hintsRemaining = computed(() => MAX_HINTS - hintsUsed.value)

  const elapsedTime = computed(() => {
    if (startTime.value === 0) return 0

    if (isPaused.value) {
      return pausedTime.value
    }

    const end = endTime.value || Date.now()
    return Math.floor((end - startTime.value) / 1000) + pausedTime.value
  })

  const digitCounts = computed(() => {
    return SudokuValidator.getDigitCounts(board.value)
  })

  const completedDigits = computed(() => {
    const completed = new Set<number>()
    digitCounts.value.forEach((count, digit) => {
      if (count === GRID_SIZE) {
        completed.add(digit)
      }
    })
    return completed
  })

  const gameState = computed<GameState>(() => ({
    board: board.value,
    solution: solution.value,
    difficulty: difficulty.value,
    startTime: startTime.value,
    endTime: endTime.value,
    isPaused: isPaused.value,
    pausedTime: pausedTime.value,
    hintsUsed: hintsUsed.value,
    hintsRemaining: hintsRemaining.value,
    errors: errors.value,
    score: score.value,
    isCompleted: isCompleted.value,
    selectedCell: selectedCell.value,
  }))

  // Helper function to check if user has made any moves
  function hasUserMoves(): boolean {
    return moveHistory.value.length > 0
  }

  // Actions
  function initializeBoard() {
    board.value = []
    for (let row = 0; row < GRID_SIZE; row++) {
      board.value[row] = []
      for (let col = 0; col < GRID_SIZE; col++) {
        board.value[row][col] = {
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
  }

  function startNewGame(selectedDifficulty: Difficulty) {
    // Reset game state
    difficulty.value = selectedDifficulty
    startTime.value = Date.now()
    endTime.value = null
    isPaused.value = false
    pausedTime.value = 0
    hintsUsed.value = 0
    errors.value = 0
    score.value = 0
    isCompleted.value = false
    selectedCell.value = null
    moveHistory.value = []

    // Clear animation states
    recentlyCompletedRows.value.clear()
    recentlyCompletedColumns.value.clear()
    recentlyCompletedBlocks.value.clear()

    // Generate new puzzle
    initializeBoard()
    solution.value = SudokuGenerator.generateSolution()
    const puzzle = SudokuGenerator.createPuzzle(solution.value, selectedDifficulty)

    // Set initial values
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (puzzle[row][col] !== 0) {
          board.value[row][col].value = puzzle[row][col]
          board.value[row][col].isInitial = true
        }
      }
    }
  }

  function selectCell(row: number, col: number) {
    selectedCell.value = { row, col }
  }

  function clearSelection() {
    selectedCell.value = null
  }

  function setCellValue(row: number, col: number, value: number | null, isDraft = false) {
    const cell = board.value[row][col]

    if (cell.isInitial) return

    // Check which rows/cols/blocks were complete before the change
    const wasRowComplete = SudokuValidator.isRowComplete(board.value, row)
    const wasColComplete = SudokuValidator.isColumnComplete(board.value, col)
    const wasBlockComplete = SudokuValidator.isBlockComplete(board.value, cell.block)

    // Store move for undo functionality
    moveHistory.value.push({
      row,
      col,
      oldValue: cell.value,
      newValue: value,
    })

    // Clear previous errors
    clearErrors()

    // Set the value
    cell.value = value
    cell.isDraft = isDraft

    if (value !== null && !isDraft) {
      // Validate the move
      const validation = SudokuValidator.validateMove(board.value, row, col, value)

      if (!validation.isValid) {
        cell.isError = true
        validation.conflicts.forEach((conflict) => {
          board.value[conflict.row][conflict.col].isError = true
        })
        errors.value++
        updateScore(-SCORING_CONFIG.error)
      } else {
        // Check if correct
        if (value === solution.value[row][col]) {
          updateScore(SCORING_CONFIG.correctCell)

          // Check if any row/col/block is newly completed
          if (!wasRowComplete && SudokuValidator.isRowComplete(board.value, row)) {
            recentlyCompletedRows.value.add(row)
            setTimeout(() => recentlyCompletedRows.value.delete(row), 2000)
          }

          if (!wasColComplete && SudokuValidator.isColumnComplete(board.value, col)) {
            recentlyCompletedColumns.value.add(col)
            setTimeout(() => recentlyCompletedColumns.value.delete(col), 2000)
          }

          if (!wasBlockComplete && SudokuValidator.isBlockComplete(board.value, cell.block)) {
            recentlyCompletedBlocks.value.add(cell.block)
            setTimeout(() => recentlyCompletedBlocks.value.delete(cell.block), 2000)
          }
        } else {
          cell.isError = true
          errors.value++
          updateScore(-SCORING_CONFIG.error)
        }
      }

      // Check for completion
      checkCompletion()
    }
  }

  function clearErrors() {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        board.value[row][col].isError = false
      }
    }
  }

  function useHint(): HintResult | null {
    if (hintsRemaining.value === 0 || selectedCell.value === null) return null

    const { row, col } = selectedCell.value
    const cell = board.value[row][col]

    if (cell.isInitial || cell.value === solution.value[row][col]) return null

    hintsUsed.value++
    const hintValue = solution.value[row][col]

    // Calculate hint penalty: -3 for first hint, -4 for second, -5 for third, etc.
    const hintPenalty = -(
      SCORING_CONFIG.firstHint +
      (hintsUsed.value - 1) * SCORING_CONFIG.hintIncrement
    )
    updateScore(hintPenalty)

    // Set the correct value
    setCellValue(row, col, hintValue)

    return { row, col, value: hintValue }
  }

  function undo() {
    if (moveHistory.value.length === 0) return

    const lastMove = moveHistory.value.pop()!
    const cell = board.value[lastMove.row][lastMove.col]

    cell.value = lastMove.oldValue
    cell.isDraft = false
    cell.isError = false

    clearErrors()
  }

  function togglePause() {
    if (isCompleted.value) return

    isPaused.value = !isPaused.value

    if (isPaused.value) {
      // Store pause state in localStorage
      pausedTime.value = elapsedTime.value
    } else {
      // Clear pause state from localStorage
      startTime.value = Date.now() - pausedTime.value * 1000
      pausedTime.value = 0
    }
  }

  function updateScore(points: number) {
    score.value = Math.max(0, score.value + points)
  }

  function calculateFinalScore(): number {
    const timeBonus = Math.max(0, SCORING_CONFIG.timeBonus - elapsedTime.value)
    return score.value + timeBonus
  }

  function checkCompletion() {
    if (SudokuValidator.isBoardComplete(board.value)) {
      isCompleted.value = true
      endTime.value = Date.now()
      score.value = calculateFinalScore()
    }
  }

  function getCompletedRows(): number[] {
    return Array.from(recentlyCompletedRows.value)
  }

  function getCompletedColumns(): number[] {
    return Array.from(recentlyCompletedColumns.value)
  }

  function getCompletedBlocks(): number[] {
    return Array.from(recentlyCompletedBlocks.value)
  }

  return {
    // State
    board,
    solution,
    difficulty,
    startTime,
    endTime,
    isPaused,
    pausedTime,
    hintsUsed,
    errors,
    score,
    isCompleted,
    selectedCell,
    moveHistory,
    recentlyCompletedRows,
    recentlyCompletedColumns,
    recentlyCompletedBlocks,

    // Computed
    hintsRemaining,
    elapsedTime,
    digitCounts,
    completedDigits,
    gameState,

    // Actions
    initializeBoard,
    startNewGame,
    selectCell,
    clearSelection,
    setCellValue,
    clearErrors,
    useHint,
    undo,
    togglePause,
    updateScore,
    calculateFinalScore,
    checkCompletion,
    getCompletedRows,
    getCompletedColumns,
    getCompletedBlocks,
    hasUserMoves,
  }
})
