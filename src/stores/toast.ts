import { defineStore } from 'pinia'

export type Toast = {
  id: number
  message: string
  type: 'info' | 'success' | 'error'
}

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [] as Toast[],
  }),
  actions: {
    add(message: string, duration = 3000, type: Toast['type'] = 'info') {
      const id = Date.now()
      this.toasts.push({ id, message, type })
      setTimeout(() => this.remove(id), duration)
    },
    remove(id: number) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    },
  },
}) 