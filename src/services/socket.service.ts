import { io } from 'socket.io-client'
import { useToastStore, type Toast } from '@/stores/toast'

const socket = io(import.meta.env.VITE_BACKEND_URL, {
  autoConnect: false,
})

// utility per esporre la connessione dopo il login
export function connectSocket() {
  if (!socket.connected) socket.connect()
  return socket
}

socket.on('connect', () => {
  console.log('🟢 Connesso al server');
  notify('🟢 Connesso al server', 'success');
})

// ---- Notifiche toast ----
export function notify(message: string, type: Toast['type'] = 'info') {
  // recuperiamo lo store ad ogni chiamata (evita problemi di import ciclici)
  useToastStore().add(message, 3000, type);
}

// socket.on('new-session', () => notify('Nuova asta iniziata!'))
// socket.on('new-bid', ({ price }) => notify(`Nuova offerta: €${price}`))
// socket.on('winner-declared', () => notify('Asta terminata!'))

socket.on('disconnect', () => {
  console.log('🔴 Disconnesso dal server');
  notify('🔴 Disconnesso dal server', 'error');
})

export default socket