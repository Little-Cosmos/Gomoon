import { BrowserWindow, app, dialog, ipcMain, shell } from 'electron'
import {
  addHistory,
  createAssistant,
  deleteAssistant,
  deleteHistory,
  getAssistants,
  getHistories,
  getUserData,
  loadAppConfig,
  setCanMultiCopy,
  setQuicklyWakeUpKeys,
  setIsOnTop,
  setModels,
  setSendWithCmdOrCtrl,
  updateAssistant,
  updateUserData,
  useAssistant,
  getLines,
  getMemories
} from './models/index'
import {
  AssistantModel,
  CreateAssistantModel,
  HistoryModel,
  SettingModel,
  UserDataModel
} from './models/model'
import {
  checkUpdate,
  hideWindow,
  minimize,
  setQuicklyWakeUp,
  updateRespHeaders,
  updateSendHeaders
} from './window'
import parseFile from './lib/ai/fileLoader'
import { writeFile } from 'fs'
import { parseURL2Str } from './lib/ai/parseURL'
import { isValidUrl } from './lib/utils'
import { autoUpdater } from 'electron-updater'
import { quitApp } from './lib'
import { embedding, tokenize } from './lib/ai/embedding/embedding'
import {
  EditFragmentOption,
  SaveMemoParams,
  cancelSaveMemo,
  editFragment,
  saveMemo
} from './lib/ai/embedding/index'

export function initAppEventsHandler() {
  /**
   * FEAT: 配置相关(特指配置页的信息)
   */
  let preBaseUrls: string[] = []
  ipcMain.handle('load-config', () => {
    const config = loadAppConfig()
    const urls: string[] = []
    if (isValidUrl(config.models.OpenAI.baseURL)) {
      urls.push(config.models.OpenAI.baseURL)
    }
    if (urls.toString() !== preBaseUrls.toString()) {
      updateSendHeaders(urls)
      updateRespHeaders(urls, {
        cspItems: {
          'connect-src': urls
        }
      })
      preBaseUrls = urls
    }
    return config
  })
  ipcMain.handle('set-is-on-top', (e, isOnTop: boolean) => {
    const mainWindow = BrowserWindow.fromWebContents(e.sender)
    mainWindow!.setAlwaysOnTop(isOnTop, 'status')
    setIsOnTop(isOnTop)
    return mainWindow!.isAlwaysOnTop()
  })
  ipcMain.handle('set-models', (_, models: SettingModel['models']) => {
    const urls: string[] = []
    if (isValidUrl(models.OpenAI.baseURL)) {
      urls.push(models.OpenAI.baseURL)
    }
    if (urls.toString() !== preBaseUrls.toString()) {
      updateSendHeaders(urls)
      updateRespHeaders(urls, {
        cspItems: {
          'connect-src': urls
        }
      })
      preBaseUrls = urls
    }
    setModels(models)
  })
  ipcMain.handle('set-can-multi-copy', (_, canMultiCopy: boolean) => {
    setCanMultiCopy(canMultiCopy)
  })

  ipcMain.handle('set-quickly-wake-up-keys', (_, keys: string) => {
    setQuicklyWakeUpKeys(keys)
    setQuicklyWakeUp(keys)
  })
  ipcMain.handle('set-send-with-cmd-or-ctrl', (_, b: boolean) => setSendWithCmdOrCtrl(b))

  /**
   * FEAT: 用户相关
   */
  ipcMain.handle('set-user-data', (_, data: Partial<UserDataModel>) => updateUserData(data))
  ipcMain.handle('get-user-data', () => getUserData())

  /**
   * FEAT: assistant 相关
   */
  ipcMain.handle('get-assistants', () => getAssistants())
  ipcMain.handle('update-assistant', (_, a: AssistantModel) => updateAssistant(a))
  ipcMain.handle('delete-assistant', (_, id: string) => deleteAssistant(id))
  ipcMain.handle('create-assistant', (_, a: CreateAssistantModel) => createAssistant(a))
  ipcMain.handle('use-assistant', (_, id: string) => useAssistant(id))

  /**
   * FEAT: history 相关
   */
  ipcMain.handle('get-histories', () => getHistories())
  ipcMain.handle('add-history', (_, history: HistoryModel) => addHistory(history))
  ipcMain.handle('delete-history', (_, id: string) => deleteHistory(id))

  /**
   * FEAT: memory 相关
   */
  ipcMain.handle('get-memories', () => getMemories())
  ipcMain.handle('edit-memory', (_, option: EditFragmentOption) => editFragment(option))
  ipcMain.handle('save-memory', (_, option: SaveMemoParams) => saveMemo(option))
  ipcMain.handle('cancel-save-memory', (_, id: string) => cancelSaveMemo(id))

  // 文件相关
  ipcMain.handle('parse-file', (_, files) => parseFile(files))
  ipcMain.handle('open-path', (_, path: string) => {
    shell.openPath(path)
  })
  ipcMain.handle('save-file', async (_, fileName: string, content: string) => {
    const res = await dialog.showSaveDialog({
      title: '保存文件',
      buttonLabel: '保存',
      defaultPath: fileName,
      filters: [
        {
          name: 'All Files',
          extensions: ['*']
        }
      ]
    })
    if (res.filePath) {
      writeFile(res.filePath, content, () => {})
    }
  })
  ipcMain.handle('embedding', async (_) => {
    embedding('hello')
  })
  ipcMain.handle('get-token-num', async (_, content: string) => {
    return (await tokenize(content)).input_ids?.size || 0
  })

  // 升级
  ipcMain.handle('check-update', async () => {
    return await checkUpdate()
  })
  ipcMain.handle('quit-for-update', () => {
    quitApp.quit()
    autoUpdater.quitAndInstall(undefined, true)
  })
  ipcMain.handle('download-update', async () => {
    return await autoUpdater.downloadUpdate()
  })

  // 其他
  app.on('browser-window-created', () => {})
  ipcMain.handle('hide-window', () => hideWindow())
  ipcMain.handle('minimize-window', () => minimize())
  ipcMain.handle('get-lines', () => getLines())
  ipcMain.handle('parse-page-to-string', (_, url: string) => parseURL2Str(url))
}
