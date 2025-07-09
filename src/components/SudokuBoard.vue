<template>
  <div
    class="flex justify-center items-center w-full sm:w-auto sm:justify-center sm:items-center"
    @click.self="clearSelection"
  >
    <div
      :class="[
        'grid grid-cols-9 gap-0 border-2 border-gray-800 dark:border-gray-300 rounded-lg overflow-hidden shadow-lg transition-colors duration-200',
        'w-full max-w-sm sm:max-w-lg',
        paused ? 'opacity-50 pointer-events-none' : '',
      ]"
    >
      <template v-for="(row, rowIndex) in board" :key="rowIndex">
        <SudokuCell
          v-for="(cell, colIndex) in row"
          :key="`${rowIndex}-${colIndex}`"
          :cell="cell"
          :isSelected="isSelected(rowIndex, colIndex)"
          :isInSelectedRow="isInSelectedRow(rowIndex)"
          :isInSelectedCol="isInSelectedCol(colIndex)"
          :isInSelectedBlock="isInSelectedBlock(cell.block)"
          :isCompletedRow="completedRows.includes(rowIndex)"
          :isCompletedCol="completedColumns.includes(colIndex)"
          :isCompletedBlock="completedBlocks.includes(cell.block)"
          @select="selectCell(rowIndex, colIndex)"
          @setValue="(value) => setCellValue(rowIndex, colIndex, value)"
          @setDraft="(value) => setCellDraftValue(rowIndex, colIndex, value)"
          :paused="paused"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useGameStore } from '@/stores/game'
import SudokuCell from './SudokuCell.vue'

const props = defineProps<{ paused?: boolean }>()
const paused = computed(() => !!props.paused)

const gameStore = useGameStore()

const board = computed(() => gameStore.board)
const selectedCell = computed(() => gameStore.selectedCell)

// Track completed items with animation
const animatedRows = ref<Set<number>>(new Set())
const animatedColumns = ref<Set<number>>(new Set())
const animatedBlocks = ref<Set<number>>(new Set())

// Timers for removing animations
const rowTimers = new Map<number, ReturnType<typeof setTimeout>>()
const columnTimers = new Map<number, ReturnType<typeof setTimeout>>()
const blockTimers = new Map<number, ReturnType<typeof setTimeout>>()

// Get completed items from store
const storeCompletedRows = computed(() => gameStore.getCompletedRows())
const storeCompletedColumns = computed(() => gameStore.getCompletedColumns())
const storeCompletedBlocks = computed(() => gameStore.getCompletedBlocks())

// Watch for newly completed items
watch(storeCompletedRows, (newRows) => {
  newRows.forEach((row) => {
    if (!animatedRows.value.has(row)) {
      animatedRows.value.add(row)

      // Clear any existing timer
      if (rowTimers.has(row)) {
        clearTimeout(rowTimers.get(row)!)
      }

      // Set timer to remove animation after 3 seconds
      const timer = setTimeout(() => {
        animatedRows.value.delete(row)
        rowTimers.delete(row)
      }, 3000)

      rowTimers.set(row, timer)
    }
  })
})

watch(storeCompletedColumns, (newColumns) => {
  newColumns.forEach((col) => {
    if (!animatedColumns.value.has(col)) {
      animatedColumns.value.add(col)

      if (columnTimers.has(col)) {
        clearTimeout(columnTimers.get(col)!)
      }

      const timer = setTimeout(() => {
        animatedColumns.value.delete(col)
        columnTimers.delete(col)
      }, 3000)

      columnTimers.set(col, timer)
    }
  })
})

watch(storeCompletedBlocks, (newBlocks) => {
  newBlocks.forEach((block) => {
    if (!animatedBlocks.value.has(block)) {
      animatedBlocks.value.add(block)

      if (blockTimers.has(block)) {
        clearTimeout(blockTimers.get(block)!)
      }

      const timer = setTimeout(() => {
        animatedBlocks.value.delete(block)
        blockTimers.delete(block)
      }, 3000)

      blockTimers.set(block, timer)
    }
  })
})

// Use animated sets for display
const completedRows = computed(() => Array.from(animatedRows.value))
const completedColumns = computed(() => Array.from(animatedColumns.value))
const completedBlocks = computed(() => Array.from(animatedBlocks.value))

function isSelected(row: number, col: number): boolean {
  return selectedCell.value?.row === row && selectedCell.value?.col === col
}

function isInSelectedRow(row: number): boolean {
  return selectedCell.value?.row === row
}

function isInSelectedCol(col: number): boolean {
  return selectedCell.value?.col === col
}

function isInSelectedBlock(block: number): boolean {
  if (!selectedCell.value) return false
  const selectedBlock = board.value[selectedCell.value.row][selectedCell.value.col].block
  return selectedBlock === block
}

function selectCell(row: number, col: number) {
  gameStore.selectCell(row, col)
}

function clearSelection() {
  gameStore.clearSelection()
}

function setCellValue(row: number, col: number, value: number | null) {
  gameStore.setCellValue(row, col, value, false)
}

function setCellDraftValue(row: number, col: number, value: number | null) {
  gameStore.setCellValue(row, col, value, true)
}

// Keyboard navigation
function handleKeyDown(event: KeyboardEvent) {
  if (paused.value) return // Prevent keyboard navigation when paused
  if (!selectedCell.value) return

  const { row, col } = selectedCell.value
  let newRow = row
  let newCol = col

  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      newRow = Math.max(0, row - 1)
      break
    case 'ArrowDown':
      event.preventDefault()
      newRow = Math.min(8, row + 1)
      break
    case 'ArrowLeft':
      event.preventDefault()
      newCol = Math.max(0, col - 1)
      break
    case 'ArrowRight':
      event.preventDefault()
      newCol = Math.min(8, col + 1)
      break
    default:
      return
  }

  if (newRow !== row || newCol !== col) {
    gameStore.selectCell(newRow, newCol)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)

  // Clear all timers
  rowTimers.forEach((timer) => clearTimeout(timer))
  columnTimers.forEach((timer) => clearTimeout(timer))
  blockTimers.forEach((timer) => clearTimeout(timer))
})
</script>
