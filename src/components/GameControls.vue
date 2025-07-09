<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-xl p-4 transition-colors duration-200 border border-gray-50 dark:border-gray-700"
  >
    <div class="flex flex-wrap gap-3">
      <button @click="useHint" :disabled="!canUseHint" :class="buttonClasses('hint', !canUseHint)">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        Hint ({{ hintsRemaining }})
      </button>

      <button @click="undo" :disabled="!canUndo" :class="buttonClasses('undo', !canUndo)">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
          />
        </svg>
        Undo
      </button>

      <button @click="togglePause" :disabled="!canPause" :class="buttonClasses('pause', !canPause)">
        <svg
          v-if="!isPaused"
          class="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <svg v-else class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {{ isPaused ? 'Resume' : 'Pause' }}
      </button>

      <button @click="startNewGame" :class="buttonClasses('new')">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        New Game
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

const hintsRemaining = computed(() => gameStore.hintsRemaining)
const isPaused = computed(() => gameStore.gameState.isPaused)
const selectedCell = computed(() => gameStore.selectedCell)
const isCompleted = computed(() => gameStore.gameState.isCompleted)

const canUseHint = computed(() => {
  return (
    hintsRemaining.value > 0 && selectedCell.value !== null && !isCompleted.value && !isPaused.value
  )
})

const canUndo = computed(() => {
  return !isCompleted.value && !isPaused.value
})

const canPause = computed(() => {
  return !isCompleted.value
})

function useHint() {
  if (canUseHint.value) {
    gameStore.useHint()
  }
}

function undo() {
  if (canUndo.value) {
    gameStore.undo()
  }
}

function togglePause() {
  if (canPause.value) {
    gameStore.togglePause()
  }
}

function startNewGame() {
  // Emit the newGame event
  emit('newGame')
}

function buttonClasses(type: string, disabled = false) {
  const baseClasses = [
    'flex',
    'items-center',
    'justify-center',
    'px-4',
    'py-2',
    'rounded-lg',
    'font-medium',
    'transition-all',
    'duration-200',
  ]

  if (disabled) {
    return [
      ...baseClasses,
      'bg-gray-100 dark:bg-gray-700',
      'text-gray-400 dark:text-gray-500',
      'cursor-not-allowed',
    ]
  }

  const typeClasses: Record<string, string[]> = {
    hint: [
      'bg-yellow-500 dark:bg-yellow-600',
      'text-white',
      'hover:bg-yellow-600 dark:hover:bg-yellow-700',
      'active:scale-95',
    ],
    undo: [
      'bg-purple-500 dark:bg-purple-600',
      'text-white',
      'hover:bg-purple-600 dark:hover:bg-purple-700',
      'active:scale-95',
    ],
    pause: [
      'bg-orange-500 dark:bg-orange-600',
      'text-white',
      'hover:bg-orange-600 dark:hover:bg-orange-700',
      'active:scale-95',
    ],
    new: [
      'bg-green-500 dark:bg-green-600',
      'text-white',
      'hover:bg-green-600 dark:hover:bg-green-700',
      'active:scale-95',
    ],
  }

  return [...baseClasses, ...(typeClasses[type] || [])]
}

const emit = defineEmits<{
  newGame: []
}>()
</script>
