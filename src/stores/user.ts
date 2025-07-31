import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: '' as string,
    nickname: '' as string,
    isAdmin: false as boolean,
  }),
  actions: {
    setUser(id: string, nickname: string, isAdmin: boolean) {
      this.userId = id
      this.nickname = nickname
      this.isAdmin = isAdmin
    },
  },
  getters: {
    getUserId: (state) => state.userId,
    getNickname: (state) => state.nickname,
    getIsAdmin: (state) => state.isAdmin,
    isAuthenticated: (state) => !!state.userId,
  },
  persist: true,
})
