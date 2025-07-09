<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-xl p-4 transition-colors duration-200 border border-gray-50 dark:border-gray-700"
  >
    <h3 class="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Leaderboard</h3>
    <div v-for="difficulty in difficulties" :key="difficulty" class="mb-6">
      <h4 :class="difficultyHeaderClass(difficulty)">
        {{ formatDifficulty(difficulty) }}
      </h4>
      <div
        v-if="recordsByDifficulty[difficulty].length === 0"
        class="text-gray-500 dark:text-gray-400 text-sm italic"
      >
        No records yet
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="(record, index) in recordsByDifficulty[difficulty]"
          :key="record.id"
          class="border rounded-lg p-3 transition-all duration-200 hover:shadow-md dark:hover:shadow-lg"
          :class="recordItemClass(index)"
        >
          <div class="flex items-center">
            <span
              class="w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3"
              :class="getRankClass(index)"
              >{{ index + 1 }}</span
            >
            <div class="flex-1">
              <div class="font-medium text-gray-800 dark:text-gray-200">
                {{ record.playerName }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(record.date) }}
              </div>
            </div>
            <div class="text-right">
              <div class="font-bold text-lg text-gray-800 dark:text-gray-200">
                {{ record.score }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatTime(record.time) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRecordsStore } from '@/stores/records'
import type { Difficulty } from '@/types/sudoku'

const recordsStore = useRecordsStore()

const difficulties: Difficulty[] = ['beginner', 'intermediate', 'hard', 'expert']
const recordsByDifficulty = computed(() => recordsStore.recordsByDifficulty)

function formatDifficulty(difficulty: Difficulty): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    return 'Today'
  } else if (diffInDays === 1) {
    return 'Yesterday'
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`
  } else {
    return date.toLocaleDateString()
  }
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function difficultyHeaderClass(difficulty: Difficulty) {
  const baseClasses = ['font-semibold', 'mb-2']
  const colorClasses = {
    beginner: 'text-green-600',
    intermediate: 'text-yellow-600',
    hard: 'text-orange-600',
    expert: 'text-red-600',
  }
  return [...baseClasses, colorClasses[difficulty] || 'text-gray-600']
}

function recordItemClass(index: number) {
  const classes = []
  if (index === 0) {
    classes.push(
      'bg-yellow-50',
      'dark:bg-yellow-900/20',
      'border-yellow-300',
      'dark:border-yellow-700',
    )
  } else if (index === 1) {
    classes.push('bg-gray-50', 'dark:bg-gray-700/20', 'border-gray-300', 'dark:border-gray-600')
  } else if (index === 2) {
    classes.push(
      'bg-orange-50',
      'dark:bg-orange-900/20',
      'border-orange-300',
      'dark:border-orange-700',
    )
  } else {
    classes.push('dark:border-gray-600')
  }
  return classes
}

function getRankClass(index: number) {
  if (index === 0) {
    return 'bg-yellow-400 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100'
  } else if (index === 1) {
    return 'bg-gray-400 dark:bg-gray-600 text-gray-900 dark:text-gray-100'
  } else if (index === 2) {
    return 'bg-orange-400 dark:bg-orange-600 text-orange-900 dark:text-orange-100'
  }
  return 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}
</script>
