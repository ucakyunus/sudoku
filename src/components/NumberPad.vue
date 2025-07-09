<template>
  <div
    :class="[
      'flex flex-row items-center justify-center gap-2 w-full max-w-sm sm:max-w-xl mt-4 sm:mt-8',
      paused ? 'opacity-50 pointer-events-none' : '',
    ]"
  >
    <button
      v-for="num in 9"
      :key="num"
      @click="selectNumber(num)"
      :class="[
        'w-12 h-12 flex items-center justify-center rounded border font-bold text-xl transition-all duration-200',
        isNumberComplete(num)
          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-300 dark:border-gray-600 cursor-not-allowed'
          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-400 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer',
      ]"
      :disabled="isNumberComplete(num) || paused"
    >
      {{ num }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { GRID_SIZE } from '@/types/sudoku'

const gameStore = useGameStore()

const digitCounts = computed(() => gameStore.digitCounts)
const selectedCell = computed(() => gameStore.selectedCell)

const props = defineProps<{ paused?: boolean }>()
const paused = computed(() => !!props.paused)

function selectNumber(num: number | null) {
  if (paused.value) return
  if (!selectedCell.value) return
  const { row, col } = selectedCell.value
  gameStore.setCellValue(row, col, num)
}

function isNumberComplete(num: number): boolean {
  const count = digitCounts.value.get(num) || 0
  return count >= GRID_SIZE
}
</script>
