import { app } from 'electron'
import { JSONSyncPreset } from 'lowdb/node'
import { AssistantModel, CreateAssistantModel, CreateMemoModel, HistoryModel } from './model'
import { SettingModel } from './model'
import {
  getDefaultConfig,
  getDefaultAssistants,
  getDefaultLines,
  getDefaultUserData,
  getDefaultMemories
} from './default'
import { join } from 'path'
import { ulid } from 'ulid'
import { merge } from 'lodash'

const appDataPath = app.getPath('userData')
const configDB = JSONSyncPreset(join(appDataPath, 'config.json'), getDefaultConfig())

/**
 * FEAT: 配置相关(特指配置页的信息)
 * 因为后续配置页的设置可能会在用户有感的情况下加载一些其他第三方或者更加底层的配置，所以这里单独抽出来，且每一个配置项都单独写一个函数
 * 后续较轻的配置项，可以合并一个函数
 */
export function loadAppConfig() {
  return merge(getDefaultConfig(), configDB.data)
}

export function setAppConfig(config: Partial<SettingModel>) {
  configDB.data = {
    ...configDB.data,
    ...config
  }
  configDB.write()
}

export function setIsOnTop(isOnTop: SettingModel['isOnTop']) {
  configDB.data = {
    ...configDB.data,
    isOnTop
  }
  configDB.write()
}

export function setModels(models: SettingModel['models']) {
  configDB.data = {
    ...configDB.data,
    models: {
      ...configDB.data.models,
      ...models
    }
  }
  configDB.write()
}

export function setCanMultiCopy(canMultiCopy: SettingModel['canMultiCopy']) {
  configDB.data = {
    ...configDB.data,
    canMultiCopy
  }
  configDB.write()
}

export function setQuicklyWakeUpKeys(quicklyWakeUpKeys: SettingModel['quicklyWakeUpKeys']) {
  configDB.data = {
    ...configDB.data,
    quicklyWakeUpKeys
  }
  configDB.write()
}

export function setSendWithCmdOrCtrl(sendWithCmdOrCtrl: SettingModel['sendWithCmdOrCtrl']) {
  configDB.data = {
    ...configDB.data,
    sendWithCmdOrCtrl
  }
  configDB.write()
}

/**
 * FEAT: 用户数据相关
 */
const userDataDB = JSONSyncPreset(join(appDataPath, 'user-data.json'), getDefaultUserData())
export function getUserData() {
  return merge(getDefaultUserData(), userDataDB.data)
}
export function updateUserData(data: Partial<typeof userDataDB.data>) {
  userDataDB.data = merge(userDataDB.data, data)
  userDataDB.write()
}

/**
 * FEAT: assistants 相关
 */
const assistantsDB = JSONSyncPreset(join(appDataPath, 'assistants.json'), getDefaultAssistants())
export function getAssistants() {
  return assistantsDB.data || []
}
export function updateAssistant(a: AssistantModel) {
  const index = assistantsDB.data.findIndex((item) => item.id === a.id)
  if (index === -1) {
    assistantsDB.data = [
      ...assistantsDB.data,
      {
        ...a,
        version: 1,
        id: ulid()
      }
    ]
  } else {
    assistantsDB.data[index] = {
      ...a,
      version:
        assistantsDB.data[index].version < a.version
          ? a.version
          : assistantsDB.data[index].version + 1
    }
  }
  assistantsDB.write()
}

export function deleteAssistant(id: string) {
  const index = assistantsDB.data.findIndex((item) => item.id === id)
  if (index === -1) {
    return
  }
  assistantsDB.data.splice(index, 1)
  assistantsDB.write()
}

export function createAssistant(a: CreateAssistantModel): AssistantModel {
  const newA = {
    ...a,
    id: ulid(),
    version: 1
  }
  assistantsDB.data.unshift(newA)
  assistantsDB.write()
  return newA
}

// 用过一个assistant后将其提到最前面
export function useAssistant(id: string) {
  const index = assistantsDB.data.findIndex((item) => item.id === id)
  if (index === -1) {
    return
  }
  const item = assistantsDB.data[index]
  assistantsDB.data.splice(index, 1)
  assistantsDB.data.unshift(item)
  assistantsDB.write()
}

/**
 * FEAT: Histories 相关
 */
const historiesDB = JSONSyncPreset<HistoryModel[]>(join(appDataPath, 'histories.json'), [])

export function getHistories() {
  return historiesDB.data || []
}

export function addHistory(h: HistoryModel) {
  historiesDB.data.unshift(h)
  historiesDB.write()
}

export function deleteHistory(id: string) {
  const index = historiesDB.data.findIndex((item) => item.id === id)
  if (index === -1) {
    return
  }
  historiesDB.data.splice(index, 1)
  historiesDB.write()
}

/**
 * FEAT: 首页显示的文字 Lines
 */
export function getLines() {
  return getDefaultLines()
}

/**
 * FEAT: 记忆相关 Memo
 */
const memoDB = JSONSyncPreset(join(appDataPath, 'memories.json'), getDefaultMemories())
export function getMemories() {
  return memoDB.data || []
}
export function createMemo(m: CreateMemoModel): CreateMemoModel {
  const newM = {
    ...m,
    id: ulid(),
    version: 1
  }
  memoDB.data.unshift(newM)
  memoDB.write()
  return newM
}
