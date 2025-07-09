<template>
  <div
    :class="cellClasses"
    @click="handleClick"
    @keydown="handleKeyDown"
    :tabindex="isEditable ? 0 : -1"
  >
    <span v-if="!cell.isDraft" :class="valueClasses">{{ displayValue }}</span>
    <span v-else class="text-gray-500 italic text-sm">{{ displayValue }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Cell } from '@/types/sudoku'

const props = defineProps<{
  cell: Cell
  isSelected: boolean
  isInSelectedRow: boolean
  isInSelectedCol: boolean
  isInSelectedBlock: boolean
  isCompletedRow: boolean
  isCompletedCol: boolean
  isCompletedBlock: boolean
}>()

const emit = defineEmits<{
  select: []
  setValue: [value: number | null]
  setDraft: [value: number | null]
}>()

const displayValue = computed(() => {
  return props.cell.value !== null ? props.cell.value : ''
})

const isEditable = computed(() => !props.cell.isInitial)

const cellClasses = computed(() => {
  const classes = [
    'relative',
    'w-10',
    'h-10',
    'sm:w-12',
    'sm:h-12',
    'flex',
    'items-center',
    'justify-center',
    'cursor-pointer',
    'transition-all',
    'duration-200',
    'text-lg',
    'font-medium',
    'aspect-square',
    'select-none',
  ]

  // Grid position classes
  if (props.cell.row % 3 === 0 && props.cell.row !== 0) {
    classes.push('border-t-2', 'border-t-gray-600')
  }
  if (props.cell.col % 3 === 0 && props.cell.col !== 0) {
    classes.push('border-l-2', 'border-l-gray-600')
  }

  // State classes
  if (props.isSelected) {
    classes.push('bg-blue-100', 'ring-blue-500')
  } else if (props.isInSelectedRow || props.isInSelectedCol || props.isInSelectedBlock) {
    classes.push('bg-gray-100')
  } else {
    classes.push('bg-white', 'hover:bg-gray-50')
  }

  if (props.cell.isError) {
    classes.push('bg-red-100', 'text-red-700')
  }

  if (!isEditable.value) {
    classes.push('font-bold', 'text-gray-800')
  }

  // Animation classes for completed lines/blocks
  if (props.isCompletedRow || props.isCompletedCol || props.isCompletedBlock) {
    classes.push('completed-animation', 'bg-green-100')
  }

  classes.push('border', 'border-gray-300')

  return classes
})

const valueClasses = computed(() => {
  const classes = []

  if (props.cell.isError) {
    classes.push('text-red-600')
  } else if (props.cell.isInitial) {
    classes.push('text-gray-800')
  } else {
    classes.push('text-blue-600')
  }

  return classes
})

function handleClick() {
  if (isEditable.value) {
    emit('select')
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (!isEditable.value || !props.isSelected) return

  event.preventDefault()

  const key = event.key

  // Number input
  if (key >= '1' && key <= '9') {
    const value = parseInt(key)
    if (event.shiftKey || event.ctrlKey) {
      emit('setDraft', value)
    } else {
      emit('setValue', value)
    }
  }

  // Delete/Backspace
  else if (key === 'Delete' || key === 'Backspace') {
    emit('setValue', null)
  }

  // Clear draft with Escape
  else if (key === 'Escape') {
    emit('setDraft', null)
  }
}
</script>

<style scoped>
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes completedPulse {
  0%,
  100% {
    opacity: 1;
    background-color: rgb(220 252 231); /* green-100 */
  }
  50% {
    opacity: 0.7;
    background-color: rgb(134 239 172); /* green-300 */
  }
}

.completed-animation {
  animation: completedPulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) 6;
}
</style>
