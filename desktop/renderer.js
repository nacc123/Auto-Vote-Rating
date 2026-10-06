const url = document.getElementById('url')
const state = document.getElementById('state')

url.value = localStorage.getItem('voteUrl') || ''
document.getElementById('open').addEventListener('click', async () => {
  localStorage.setItem('voteUrl', url.value)
  state.textContent = 'Chargement…'
  try { await window.avr.openVote(url.value) }
  catch (e) { state.textContent = e.message }
})
document.getElementById('close').addEventListener('click', () => window.avr.closeVote())

window.avr.onVoteState((s) => {
  if (s.type === 'cooldown') {
    const d = Number.isFinite(s.next) ? new Date(s.next).toLocaleString() : s.raw
    state.textContent = 'Déjà voté — prochain vote : ' + d
  } else if (s.type === 'available') state.textContent = 'Vote disponible'
  else if (s.type === 'success') state.textContent = 'Vote confirmé'
  else if (s.type === 'email-verification') state.textContent = 'Vérification e-mail requise — saisissez le code manuellement'
  else if (s.type === 'message') state.textContent = s.text || 'Message du site'
  else if (s.type === 'error') state.textContent = 'Erreur : ' + s.text
  else state.textContent = 'Page chargée — état non identifié'
})
