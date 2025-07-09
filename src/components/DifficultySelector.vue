<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-xl p-6 transition-colors duration-200 border border-gray-50 dark:border-gray-700"
  >
    <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
      Select Difficulty
    </h2>

    <div class="grid grid-cols-2 gap-4">
      <button
        v-for="(config, key) in DIFFICULTY_CONFIGS"
        :key="key"
        @click="selectDifficulty(key as Difficulty)"
        :class="difficultyButtonClasses(key as Difficulty)"
      >
        <div class="text-xl font-bold mb-1">{{ formatDifficulty(key as Difficulty) }}</div>
        <div class="text-sm opacity-75">
          {{ config.visibleCells.min }}-{{ config.visibleCells.max }} cells
        </div>
        <div v-if="topScores[key as Difficulty]" class="text-xs mt-2">
          Best: {{ topScores[key as Difficulty] }}
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRecordsStore } from '@/stores/records'
import { DIFFICULTY_CONFIGS, type Difficulty } from '@/types/sudoku'

const emit = defineEmits<{
  select: [difficulty: Difficulty]
}>()

const recordsStore = useRecordsStore()
const topScores = computed(() => recordsStore.topScores)

function selectDifficulty(difficulty: Difficulty) {
  emit('select', difficulty)
}

function formatDifficulty(difficulty: Difficulty): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
}

function difficultyButtonClasses(difficulty: Difficulty) {
  const baseClasses = [
    'p-6',
    'rounded-lg',
    'text-white',
    'font-medium',
    'transition-all',
    'duration-200',
    'hover:scale-105',
    'active:scale-95',
    'shadow-lg',
    'hover:shadow-xl',
  ]

  const colorClasses = {
    beginner: ['bg-green-500', 'hover:bg-green-600'],
    intermediate: ['bg-yellow-500', 'hover:bg-yellow-600'],
    hard: ['bg-orange-500', 'hover:bg-orange-600'],
    expert: ['bg-red-500', 'hover:bg-red-600'],
  }

  return [...baseClasses, ...(colorClasses[difficulty] || [])]
}
</script>
