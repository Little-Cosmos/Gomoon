import CrossMark from '@renderer/assets/icon/base/CrossMark'
import Plus from '@renderer/assets/icon/base/Plus'
import BaseFileIcon from '@renderer/assets/icon/file/baseFileIcon'
import { useLoading } from '@renderer/components/ui/DynamicLoading'
import Switch from '@renderer/components/ui/SwitchItem'
import { useToast } from '@renderer/components/ui/Toast'
import { For, createSignal } from 'solid-js'
import { MemoModel } from 'src/main/models/model'

export default function (props: {
  memo: MemoModel
  onCancel: () => void
  onSave: (m: MemoModel) => void
}) {
  const [m, setM] = createSignal(props.memo)
  const [useLM, setUseLM] = createSignal(true)
  const load = useLoading()
  const toast = useToast()
  function setField(key: keyof MemoModel, value: any) {
    setM({
      ...m(),
      [key]: value
    })
  }
  return (
    <div class="relative m-4 flex flex-col gap-2 rounded-2xl  bg-dark p-4 duration-150">
      <span>记忆名称</span>
      <input
        type="text"
        value={m().name}
        onChange={(e) => setField('name', e.currentTarget.value)}
        placeholder="记忆胶囊名称"
      />
      <span>介绍</span>
      <input
        type="text"
        value={m().introduce ?? ''}
        onChange={(e) => setField('introduce', e.currentTarget.value)}
        placeholder="可不填"
      />
      <div class="my-1 mb-3">
        <div class="mb-2 flex justify-between">
          <span>记忆片段</span>
          <div class="w-28">
            <Switch
              size="sm"
              label="大模型优化"
              checked={useLM()}
              onCheckedChange={() => {
                setUseLM(!useLM())
              }}
            />
          </div>
        </div>
        <For each={m().fragment}>
          {(file) => (
            <div class="flex select-none justify-between">
              <div class="mt-2 flex gap-1">
                <BaseFileIcon height={20} width={20} />
                {file.name}
              </div>
              <CrossMark class="cursor-pointer hover:text-active" height={20} width={20} />
            </div>
          )}
        </For>

        <label for="file" class="cursor-pointer">
          <div class="group/add mt-2 flex w-full cursor-pointer items-center justify-center gap-1 rounded-md border-dashed border-gray py-1 hover:border-active">
            <span class="text-base">添加</span>
            <Plus
              class="text-gray duration-100 group-hover/add:text-active"
              height={20}
              width={20}
            />
          </div>
          <input
            id="file"
            type="file"
            class="hidden"
            accept=".md"
            multiple={false}
            onChange={async (e) => {
              const file = e.target.files![0]
              e.target.value = ''
              if (file) {
                load.show('解析文件中')
                try {
                  const res = await window.api.editFragment({
                    id: m().id,
                    fragment: {
                      name: file.name,
                      from: file.path,
                      type: file.name.split('.').pop() as 'md' | 'xlsx'
                    },
                    type: 'add',
                    useLM: useLM()
                  })
                  if (!res.suc) {
                    toast.error(res.reason || '解析失败')
                  } else {
                    setField('fragment', [
                      ...m().fragment,
                      {
                        type: file.name.split('.').pop() as 'md' | 'xlsx',
                        name: file.name
                      }
                    ])
                  }
                } catch (error: any) {
                  toast.error(error?.message || '解析失败')
                }
                load.hide()
              }
            }}
          />
        </label>
      </div>
      <div class="flex justify-around">
        <button
          class="duration-300 hover:bg-active"
          onClick={() => {
            props.onCancel()
          }}
        >
          取消
        </button>
        <button
          class="duration-300 hover:bg-active"
          onClick={() => {
            props.onSave(m())
          }}
        >
          保存
        </button>
      </div>
    </div>
  )
}
