<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { getUsers as apiGetUsers, getCompletedSessions as apiGetCompletedSessions } from '@/services/apis/apis'   // API che restituisce gli utenti
import socket, { connectSocket, notify } from '@/services/socket.service'

interface User {
  id: string
  name: string
}

interface Player {
    id: string;
    name: string;
    role: string;
    price: number;
}

interface Sessions {
    price: number;
    winner: User;
    player: Player;
}

const users   = ref<User[]>([])
const loading = ref(true)
const sessions = ref<Sessions[]>([])

async function fetchCompletedSessions() {
  const data = await apiGetCompletedSessions()
  sessions.value = data.sessions
}

// Fetch utenti → N colonne
onMounted(async () => {
  connectSocket()
  try {
    const data = await apiGetUsers()
    users.value = data.map((user: User) => ({ id: user.id, name: user.name }))
    await fetchCompletedSessions()

    socket.on('winner-declared', ({ winnerName, price }) => {
      console.log('winner-declared', winnerName, price)
      notify(`🏆 Vincitore: ${winnerName} – €${price}`, 'success')
      fetchCompletedSessions()
    })
  } catch (err) {
    console.error(err)
    notify('Errore fetching users', 'error')
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  socket.off('winner-declared')
})

// Configurazione delle 25 righe
const rolesOrder = [
  { role: 'P', label: 'Portieri',       count: 3, color: 'bg-purple-100 text-black' },        // neutro chiaro
  { role: 'D', label: 'Difensori',      count: 8, color: 'bg-gray-100   text-black' },       // alternanza lieve
  { role: 'C', label: 'Centrocampisti', count: 8, color: 'bg-gray-200   text-black' },
  { role: 'A', label: 'Attaccanti',     count: 6, color: 'bg-purple-200 text-black' }, 
] as const



interface TableRow {
  role: string
  slot: number
  color: string
}

// Genera le 25 righe nell’ordine corretto
const tableRows = computed<TableRow[]>(() => {
  const rows: TableRow[] = []
  rolesOrder.forEach(group => {
    for (let i = 1; i <= group.count; i++) {
      rows.push({ role: group.role, slot: i, color: group.color })
    }
  })
  return rows
});

const getUserPlayer = (role: string, slot: number, userId: string) => {
  const userSession = sessions.value.filter(session => session.winner.id === userId);
  const userPlayers = userSession.filter(session => session.player.role === role);
  if (userPlayers[slot - 1]) {
    return `${userPlayers[slot - 1].player.name} ${userPlayers[slot - 1].price}`
  }
  return  `-`
}

const getUserRemainingAmount = (userId: string) => {
  const initialAmount = 500;
  const userSession = sessions.value.filter(session => session.winner.id === userId);
  const totalSpent = userSession.reduce((acc, session) => acc + session.price, 0);
  return initialAmount - totalSpent;
}
</script>

<template>
  <div class="text-center space-y-3">
    <!-- intestazione fissa -->
    <div class="fixed top-0 left-0 w-full bg-indigo-800 py-2 z-50 shadow-md">
      <h2 class="text-2xl font-bold text-white">Tabellone</h2>
    </div>
    <!-- spazio per l’intestazione fissa -->
    <div class="h-6"></div>

    <!-- tabella -->
    <div class="overflow-x-auto" v-if="users.length > 0">
      <!-- rimosso w-full: la tabella non si espande oltre i contenuti -->
      <table class="min-w-max border-collapse">
        <!-- header: un th per ogni utente -->
        <thead>
          <tr>
            <th
              v-for="user in users"
              :key="user.id"
              class="min-w-[140px] px-3 py-2 text-center bg-indigo-800 text-white sticky top-0 z-10"
            >
              {{ user.name }} ({{ getUserRemainingAmount(user.id) }})
            </th>
          </tr>
        </thead>

        <!-- 25 righe -->
        <tbody>
          <template v-for="row in tableRows" :key="row.role + row.slot">
            <tr :class="row.color">
              <td
                v-for="user in users"
                :key="user.id"
                class="min-w-[140px] border border-gray-300 px-2 py-1 text-center align-middle whitespace-nowrap"
              >
                <transition name="fade" mode="out-in">
                  <span
                    :key="getUserPlayer(row.role, row.slot, user.id)"
                    class="text-sm font-semibold"
                  >
                    {{ getUserPlayer(row.role, row.slot, user.id) }}
                  </span>
                </transition>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
/* Fade-in */
.fade-enter-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from {
  opacity: 0;
}
.fade-enter-to {
  opacity: 1;
}
</style>