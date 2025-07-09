<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="flex flex-col items-center justify-center">
      <h1 class="text-4xl font-bold text-center text-gray-800 mb-8 dark:text-amber-50">
        Sudoku Game
      </h1>
      <DifficultySelector @select="startGame" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Difficulty } from '@/types/sudoku'
import DifficultySelector from '@/components/DifficultySelector.vue'

const router = useRouter()

function startGame(difficulty: Difficulty) {
  router.push(`/game/${difficulty}`)
}
</script>
