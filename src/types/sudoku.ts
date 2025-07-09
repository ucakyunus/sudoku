export type Difficulty = 'beginner' | 'intermediate' | 'hard' | 'expert'

export type ButtonType = 'hint' | 'undo' | 'pause' | 'new'

export interface DifficultyConfig {
  name: Difficulty
  visibleCells: { min: number; max: number }
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  beginner: { name: 'beginner', visibleCells: { min: 36, max: 40 } },
  intermediate: { name: 'intermediate', visibleCells: { min: 32, max: 36 } },
  hard: { name: 'hard', visibleCells: { min: 28, max: 32 } },
  expert: { name: 'expert', visibleCells: { min: 24, max: 28 } },
}

export interface Cell {
  value: number | null
  isInitial: boolean
  isError: boolean
  isDraft: boolean
  row: number
  col: number
  block: number
  hasScored: boolean
}

export interface GameState {
  board: Cell[][]
  solution: number[][]
  difficulty: Difficulty
  startTime: number
  endTime: number | null
  isPaused: boolean
  pausedTime: number
  hintsUsed: number
  hintsRemaining: number
  errors: number
  score: number
  isCompleted: boolean
  selectedCell: { row: number; col: number } | null
}

export interface GameRecord {
  id: string
  playerName: string
  score: number
  difficulty: Difficulty
  time: number
  date: number
  hintsUsed: number
  errors: number
}

export interface HintResult {
  row: number
  col: number
  value: number
}

export interface ValidationResult {
  isValid: boolean
  conflicts: Array<{ row: number; col: number }>
}

export interface ScoringConfig {
  correctCell: number
  firstHint: number
  hintIncrement: number
  error: number
  timeBonus: number
}

export const SCORING_CONFIG: ScoringConfig = {
  correctCell: 5,
  firstHint: 3,
  hintIncrement: 1,
  error: 1,
  timeBonus: 500,
}

export const GRID_SIZE = 9
export const BLOCK_SIZE = 3
export const MAX_HINTS = 10
