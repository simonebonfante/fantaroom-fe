import api from './'

export async function loginOrCreateUser(nickname: string) {
  const res = await api.post('/users/me', { name: nickname })
  return res.data
}

// === NUOVE API ===

// Sessione attiva (giocatore correntemente in asta)
export async function getActiveSession() {
  const res = await api.get('/sessions/active')
  return res.data
}

// Lancio di un nuovo giocatore (solo admin)
export async function launchPlayer(role: string) {
  const res = await api.post('/players/launch', { role })
  return res.data
}

// Dettaglio giocatore per ID
export async function getPlayerById(id: string) {
  const res = await api.get(`/players/${id}`)
  return res.data
}

export async function placeBid(userId: string, price: number) {
  const res = await api.post('/sessions/place-bid', { userId, price })
  return res.data
}

export async function declareWinner() {
  const res = await api.post('/sessions/declare-winner')
  return res.data
}

export async function skipSession() {
  const res = await api.post('/sessions/skip-session')
  return res.data
}