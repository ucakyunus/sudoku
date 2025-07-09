<template>
  <Transition name="modal">
    <div
      v-if="show"
      class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
      @click.self="close"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto transition-colors duration-200"
      >
        <div class="text-center">
          <div class="mb-6">
            <svg
              class="w-24 h-24 mx-auto text-green-500 dark:text-green-400 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Congratulations!</h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">You've completed the Sudoku puzzle!</p>

          <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div class="grid grid-cols-2 gap-4 text-left">
              <div>
                <span class="text-gray-600 dark:text-gray-400">Final Score:</span>
                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ score }}</div>
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">Time:</span>
                <div class="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {{ formattedTime }}
                </div>
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">Hints Used:</span>
                <div class="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  {{ hintsUsed }}
                </div>
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">Errors:</span>
                <div
                  class="text-xl font-semibold"
                  :class="{
                    'text-red-600 dark:text-red-400': errors > 0,
                    'text-gray-800 dark:text-gray-200': errors === 0,
                  }"
                >
                  {{ errors }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="isHighScore" class="mb-6">
            <div class="text-xl font-bold text-yellow-600 dark:text-yellow-400 mb-3">
              🏆 New High Score! 🏆
            </div>
            <div class="flex items-center gap-2">
              <input
                v-model="playerName"
                @keyup.enter="saveScore"
                type="text"
                placeholder="Enter your name"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                maxlength="20"
              />
              <button
                @click="saveScore"
                :disabled="!playerName.trim()"
                class="px-6 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          <div class="flex gap-3 justify-center">
            <button
              @click="startNewGame"
              class="px-6 py-3 bg-green-500 dark:bg-green-600 text-white rounded-lg font-medium hover:bg-green-600 dark:hover:bg-green-700 transition-colors"
            >
              New Game
            </button>
            <button
              @click="close"
              class="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGameStore } from '@/stores/game'
import { useRecordsStore } from '@/stores/records'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  newGame: []
}>()

const gameStore = useGameStore()
const recordsStore = useRecordsStore()

const playerName = ref('')
const savedScore = ref(false)

const score = computed(() => gameStore.gameState.score)
const time = computed(() => gameStore.elapsedTime)
const hintsUsed = computed(() => gameStore.gameState.hintsUsed)
const errors = computed(() => gameStore.gameState.errors)
const difficulty = computed(() => gameStore.gameState.difficulty)

const formattedTime = computed(() => {
  const seconds = time.value
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
})

const isHighScore = computed(() => {
  return !savedScore.value && recordsStore.isHighScore(score.value, difficulty.value)
})

function saveScore() {
  if (!playerName.value.trim() || savedScore.value) return

  recordsStore.addRecord({
    playerName: playerName.value.trim(),
    score: score.value,
    difficulty: difficulty.value,
    time: time.value,
    hintsUsed: hintsUsed.value,
    errors: errors.value,
  })

  savedScore.value = true
}

function close() {
  emit('close')
}

function startNewGame() {
  emit('newGame')
}

// Reset state when modal is shown
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      playerName.value = ''
      savedScore.value = false
    }
  },
)
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
