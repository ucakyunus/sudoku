<template>
  <div class="w-full max-w-7xl mx-auto px-4 mt-4 lg:mt-0 flex flex-col justify-center lg:h-screen">
    <h1 class="text-3xl font-bold text-center text-gray-800 mb-12 dark:text-amber-50">
      Sudoku Game
    </h1>

    <div class="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-6">
      <!-- Left Panel -->
      <div class="hidden lg:block space-y-4">
        <GameControls @newGame="goToDifficultySelector" />
        <GameStats :currentTick="tick" />
      </div>

      <!-- Center - Game Board -->
      <div
        class="flex flex-col items-center justify-start min-h-[450px] sm:min-h-[550px] w-full rounded-lg shadow-lg bg-white/80 dark:sm:bg-gray-900/80 p-4"
      >
        <SudokuBoard :paused="isPaused" />
        <NumberPad :paused="isPaused" />
      </div>

      <!-- Right Panel -->
      <div class="hidden lg:block space-y-6">
        <SudokuLeaderboard />
      </div>
    </div>

    <!-- Mobile responsive layout -->
    <div class="lg:hidden flex flex-col space-y-4 mt-4">
      <div class="order-2 space-y-4">
        <GameControls @newGame="goToDifficultySelector" />
        <GameStats :currentTick="tick" />
      </div>
      <div class="order-3">
        <SudokuLeaderboard />
      </div>
    </div>

    <!-- Game Completion Modal -->
    <GameCompletionModal
      :show="showCompletionModal"
      @close="closeCompletionModal"
      @newGame="goToDifficultySelector"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, onBeforeMount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/stores/game'
import type { Difficulty } from '@/types/sudoku'

// Components
import SudokuBoard from '@/components/SudokuBoard.vue'
import GameStats from '@/components/GameStats.vue'
import GameControls from '@/components/GameControls.vue'
import NumberPad from '@/components/NumberPad.vue'
import SudokuLeaderboard from '@/components/SudokuLeaderboard.vue'
import GameCompletionModal from '@/components/GameCompletionModal.vue'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()

const showCompletionModal = ref(false)
const hideBoard = ref(false)

const difficulty = computed(() => route.params.difficulty as Difficulty)
const isPaused = computed(() => gameStore.gameState.isPaused)
const isCompleted = computed(() => gameStore.gameState.isCompleted)

const tick = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function startTimer() {
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    tick.value++
  }, 1000)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

watch([isPaused, isCompleted], ([paused, completed]) => {
  if (!paused && !completed) {
    startTimer()
  } else {
    stopTimer()
  }
})

function goToDifficultySelector() {
  router.push('/')
}

function closeCompletionModal() {
  showCompletionModal.value = false
}

// Auto-pause on tab change
function handleVisibilityChange() {
  if (document.hidden && !isCompleted.value && !isPaused.value) {
    gameStore.togglePause()
  }
}

// Watch for game completion
watch(isCompleted, (completed) => {
  if (completed) {
    showCompletionModal.value = true
    stopTimer()
  }
})

// Hide board after a delay when paused (to prevent cheating)
watch(isPaused, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      if (isPaused.value) {
        hideBoard.value = true
      }
    }, 3000)
  } else {
    hideBoard.value = false
  }
})

// Handle page reload - pause the game
function handleBeforeUnload() {
  if (!isCompleted.value && !isPaused.value) {
    gameStore.togglePause()
  }
}

onBeforeMount(() => {
  // Start a new game with the selected difficulty
  gameStore.startNewGame(difficulty.value)
})

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('beforeunload', handleBeforeUnload)

  if (!isPaused.value && !isCompleted.value) {
    startTimer()
  }
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  stopTimer()
})
</script>
