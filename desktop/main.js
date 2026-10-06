const { app, BrowserWindow, BrowserView, ipcMain, session, shell } = require('electron')
const path = require('path')

let win
let voteView

function createWindow() {
  win = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 900,
    minHeight: 620,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  win.loadFile('index.html')
}

function validVoteUrl(value) {
  try {
    const u = new URL(value)
    return u.protocol === 'https:' && (u.hostname === 'serveur-prive.net' || u.hostname.endsWith('.serveur-prive.net'))
  } catch {
    return false
  }
}

ipcMain.handle('open-vote', async (_event, url) => {
  if (!validVoteUrl(url)) throw new Error('URL serveur-prive.net invalide')

  if (voteView) {
    win.removeBrowserView(voteView)
    voteView.webContents.destroy()
  }

  voteView = new BrowserView({
    webPreferences: {
      partition: 'persist:serveur-prive',
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  win.setBrowserView(voteView)
  const [w, h] = win.getContentSize()
  voteView.setBounds({ x: 300, y: 64, width: Math.max(600, w - 300), height: Math.max(500, h - 64) })
  voteView.setAutoResize({ width: true, height: true })

  voteView.webContents.setWindowOpenHandler(({ url: target }) => {
    if (validVoteUrl(target)) return { action: 'allow' }
    shell.openExternal(target)
    return { action: 'deny' }
  })

  voteView.webContents.on('did-finish-load', inspectState)
  await voteView.webContents.loadURL(url)
  return true
})

ipcMain.handle('close-vote', () => {
  if (!voteView) return
  win.removeBrowserView(voteView)
  voteView.webContents.destroy()
  voteView = null
})

async function inspectState() {
  if (!voteView || voteView.webContents.isDestroyed()) return
  try {
    const state = await voteView.webContents.executeJavaScript(`
      (() => {
        const counter = document.querySelector('.message-blured [data-counter]')
        if (counter) {
          const raw = counter.getAttribute('data-counter')
          return { type: 'cooldown', next: Date.parse(raw), raw }
        }
        const success = document.querySelector('.ajax-msg .message-success, #voteForm[data-vote-cooldown-pending="true"]')
        if (success) return { type: 'success', text: success.textContent?.trim() || '' }
        const error = document.querySelector('.ajax-msg .message-danger')
        if (error) return { type: 'message', text: error.textContent?.replace(/\\s+/g, ' ').trim() || '' }
        const text = (document.body?.innerText || '').toLowerCase()
        if ((text.includes('vérification de vote') || text.includes('verification de vote')) &&
            (text.includes('e-mail') || text.includes('email') || text.includes('code'))) {
          return { type: 'email-verification' }
        }
        if (document.querySelector('#voteBtn')) return { type: 'available' }
        return { type: 'unknown' }
      })()
    `)
    win.webContents.send('vote-state', state)
  } catch (error) {
    win.webContents.send('vote-state', { type: 'error', text: error.message })
  }
}

setInterval(() => {
  if (voteView && !voteView.webContents.isDestroyed()) inspectState()
}, 2000)

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
