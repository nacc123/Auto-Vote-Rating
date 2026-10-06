const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('avr', {
  openVote: (url) => ipcRenderer.invoke('open-vote', url),
  closeVote: () => ipcRenderer.invoke('close-vote'),
  onVoteState: (callback) => ipcRenderer.on('vote-state', (_event, state) => callback(state))
})
