import { createRouter, createWebHistory } from 'vue-router'
import DifficultyView from '@/views/DifficultyView.vue'
import GameView from '@/views/GameView.vue'
import type { Difficulty } from '@/types/sudoku'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'difficulty',
      component: DifficultyView,
    },
    {
      path: '/game/:difficulty',
      name: 'game',
      component: GameView,
      props: true,
      beforeEnter: (to, from, next) => {
        const difficulty = to.params.difficulty as string
        const validDifficulties: Difficulty[] = ['beginner', 'intermediate', 'hard', 'expert']

        if (validDifficulties.includes(difficulty as Difficulty)) {
          next()
        } else {
          next('/')
        }
      },
    },
  ],
})

export default router
