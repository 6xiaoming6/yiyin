<script lang='ts'>
  import type { IFramePreset, IFramePresetOptions } from '@/common/const/def-presets'
  import { extractPresetOptions } from '@/common/const/def-presets'
  import { cpObj } from '@common/utils'
  import { Drawer, Message } from '@ggchivalrous/db-ui'
  import { config } from '@web/store/config'
  import { md5 } from '@web/util/md5'

  import PresetDialog from './preset-dialog.svelte'

  import './index.scss'

  export let visible = false
  export let beforeClose: any = null

  let currentPresetName = '默认柔和'

  interface IDialogData {
    visible: boolean
    title: string
    name: string
    onConfirm: (name: string) => void
  }

  let dialog: IDialogData = {
    visible: false,
    title: '',
    name: '',
    onConfirm: () => {},
  }

  $: systemPresets = ($config.presets || []).filter(p => p.type === 'system')
  $: customPresets = ($config.presets || []).filter(p => p.type === 'custom')

  /**
   * 应用预设：将预设的选项更新到当前配置中
   */
  function applyPreset(preset: IFramePreset) {
    config.update((v) => {
      v.options = Object.assign({}, v.options, cpObj(preset.options))
      currentPresetName = preset.name
      return v
    })
    Message.success(`已应用预设「${preset.name}」`)
  }

  /**
   * 更新预设：将当前参数保存到已有预设中
   */
  function updatePreset(preset: IFramePreset) {
    config.update((v) => {
      const target = v.presets.find(p => p.key === preset.key)
      if (target) {
        target.options = extractPresetOptions(v.options)
      }
      return v
    })
    Message.success(`已更新预设「${preset.name}」`)
  }

  /**
   * 删除预设
   */
  function deletePreset(preset: IFramePreset) {
    config.update((v) => {
      const index = v.presets.findIndex(p => p.key === preset.key)
      if (index !== -1) {
        v.presets.splice(index, 1)
      }
      return v
    })
    Message.success(`已删除预设「${preset.name}」`)
  }

  /**
   * 重命名预设
   */
  function renamePreset(preset: IFramePreset) {
    dialog = {
      visible: true,
      title: '重命名预设',
      name: preset.name,
      onConfirm: (name: string) => {
        config.update((v) => {
          const target = v.presets.find(p => p.key === preset.key)
          if (target) {
            target.name = name
          }
          return v
        })
        Message.success(`已重命名为「${name}」`)
      },
    }
  }

  /**
   * 保存当前为新预设
   */
  function saveAsNewPreset() {
    dialog = {
      visible: true,
      title: '保存预设',
      name: '',
      onConfirm: (name: string) => {
        config.update((v) => {
          v.presets.push({
            key: md5(`${Date.now()}-${name}`),
            name,
            type: 'custom',
            options: extractPresetOptions(v.options),
          })
          return v
        })
        Message.success(`已保存预设「${name}」`)
      },
    }
  }
</script>

<Drawer
  size='500px'
  title='印框预设'
  bind:visible
  direction='rtl'
  {beforeClose}
  modal={false}
>
  <div class='preset-setting-wrap'>
    <div class='current-preset'>
      当前使用：<span class='current-preset-name'>{currentPresetName}</span>
    </div>

    <div class='preset-head'>
      <div class='button grass' on:click={saveAsNewPreset} on:keypress role='button' tabindex='-1'>
        + 保存当前为新预设
      </div>
    </div>

    {#if systemPresets.length}
      <div class='preset-section'>
        <div class='preset-section-title'>内置预设</div>
        {#each systemPresets as preset (preset.key)}
          <div class='preset-item'>
            <span class='preset-name'>{preset.name}</span>
            <div class='preset-actions'>
              <span class='button grass' on:click={() => applyPreset(preset)} on:keypress role='button' tabindex='-1'>应用</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    {#if customPresets.length}
      <div class='preset-section'>
        <div class='preset-section-title'>我的预设</div>
        {#each customPresets as preset (preset.key)}
          <div class='preset-item'>
            <span class='preset-name'>{preset.name}</span>
            <div class='preset-actions'>
              <span class='button grass' on:click={() => applyPreset(preset)} on:keypress role='button' tabindex='-1'>应用</span>
              <span class='button grass' on:click={() => updatePreset(preset)} on:keypress role='button' tabindex='-1'>更新</span>
              <span class='button grass' on:click={() => renamePreset(preset)} on:keypress role='button' tabindex='-1'>重命名</span>
              <span class='button grass' on:click={() => deletePreset(preset)} on:keypress role='button' tabindex='-1'>删除</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</Drawer>

<PresetDialog
  bind:visible={dialog.visible}
  title={dialog.title}
  name={dialog.name}
  onConfirm={dialog.onConfirm}
/>
