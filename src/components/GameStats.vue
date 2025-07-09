<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-xl p-4 transition-colors duration-200 border border-gray-50 dark:border-gray-700"
  >
    <h3 class="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Game Statistics</h3>

    <div class="space-y-3">
      <div class="flex justify-between items-center">
        <span class="text-gray-600 dark:text-gray-400 font-medium">Difficulty</span>
        <span :class="difficultyClass">{{ formattedDifficulty }}</span>
      </div>

      <div class="flex justify-between items-center">
        <span class="text-gray-600 dark:text-gray-400 font-medium">Time</span>
        <span class="text-gray-800 dark:text-gray-200 font-semibold">{{ formattedTime }}</span>
      </div>

      <div class="flex justify-between items-center">
        <span class="text-gray-600 dark:text-gray-400 font-medium">Score</span>
        <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ score }}</span>
      </div>

      <div class="flex justify-between items-center">
        <span class="text-gray-600 dark:text-gray-400 font-medium">Hints Used</span>
        <span class="text-gray-800 dark:text-gray-200 font-semibold"
          >{{ hintsUsed }} / {{ MAX_HINTS }}</span
        >
      </div>

      <div class="flex justify-between items-center">
        <span class="text-gray-600 dark:text-gray-400 font-medium">Errors</span>
        <span
          class="text-gray-800 dark:text-gray-200 font-semibold"
          :class="{ 'text-red-600 dark:text-red-400': errors > 0 }"
          >{{ errors }}</span
        >
      </div>
    </div>

    <div v-if="isPaused" class="mt-4 text-center">
      <div class="text-xl font-bold text-orange-600 dark:text-orange-400 animate-pulse">
        GAME PAUSED
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { MAX_HINTS } from '@/types/sudoku'

// Props to trigger reactivity
const props = defineProps<{
  currentTick?: number
}>()

const gameStore = useGameStore()

const difficulty = computed(() => gameStore.gameState.difficulty)
const score = computed(() => gameStore.gameState.score)
const hintsUsed = computed(() => gameStore.gameState.hintsUsed)
const errors = computed(() => gameStore.gameState.errors)
const isPaused = computed(() => gameStore.gameState.isPaused)

const formattedDifficulty = computed(() => {
  return difficulty.value.charAt(0).toUpperCase() + difficulty.value.slice(1)
})

const formattedTime = computed(() => {
  // This will now recompute when currentTick changes
  const seconds = props.currentTick ?? gameStore.elapsedTime
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
})

const difficultyClass = computed(() => {
  const classes = ['text-gray-800', 'font-semibold']
  const difficultyColors = {
    beginner: 'text-green-600',
    intermediate: 'text-yellow-600',
    hard: 'text-orange-600',
    expert: 'text-red-600',
  }
  classes.push(difficultyColors[difficulty.value] || 'text-gray-600')
  return classes
})
</script>
