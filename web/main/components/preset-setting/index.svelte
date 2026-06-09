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
  let expandedPresetKey = ''

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

  function getPresetDetailList(options: IFramePresetOptions) {
    return [
      { label: '主图占比', value: `${options.main_img_w_rate}%` },
      { label: '文本间距', value: options.text_margin },
      { label: '上下边距', value: options.mini_top_bottom_margin },
      { label: '圆角', value: options.radius_show ? options.radius : '关闭' },
      { label: '阴影', value: options.shadow_show ? options.shadow : '关闭' },
      { label: '输出质量', value: options.quality },
      {
        label: '宽高比',
        value: options.bg_rate_show && options.bg_rate?.w && options.bg_rate?.h
          ? `${options.bg_rate.w}:${options.bg_rate.h}`
          : '原图比例',
      },
      { label: '背景', value: options.solid_bg ? `纯色 ${options.solid_color}` : `模糊 ${options.bg_blur}%` },
      { label: '横屏输出', value: options.landscape ? '开启' : '关闭' },
      { label: '原尺寸输出', value: options.origin_wh_output ? '开启' : '关闭' },
    ]
  }

  function togglePresetDetail(key: string) {
    expandedPresetKey = expandedPresetKey === key ? '' : key
  }

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
  class='preset-setting-drawer'
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
          <div class='preset-item' class:expanded={expandedPresetKey === preset.key}>
            <div class='preset-item-main'>
              <span class='preset-name'>{preset.name}</span>
              <div class='preset-actions'>
                <span class='button grass' on:click={() => applyPreset(preset)} on:keypress role='button' tabindex='-1'>应用</span>
              </div>
              <span
                class='preset-expand-icon db-icon-arrow-down'
                class:open={expandedPresetKey === preset.key}
                title='查看预设参数'
                on:click={() => togglePresetDetail(preset.key)}
                on:keypress
                role='button'
                tabindex='-1'
              ></span>
            </div>

            {#if expandedPresetKey === preset.key}
              <div class='preset-detail-list'>
                {#each getPresetDetailList(preset.options) as item}
                  <div class='preset-detail-item'>
                    <span>{item.label}</span>
                    <b>{item.value}</b>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    {#if customPresets.length}
      <div class='preset-section'>
        <div class='preset-section-title'>我的预设</div>
        {#each customPresets as preset (preset.key)}
          <div class='preset-item' class:expanded={expandedPresetKey === preset.key}>
            <div class='preset-item-main'>
              <span class='preset-name'>{preset.name}</span>
              <div class='preset-actions'>
                <span class='button grass' on:click={() => applyPreset(preset)} on:keypress role='button' tabindex='-1'>应用</span>
                <span class='button grass' on:click={() => updatePreset(preset)} on:keypress role='button' tabindex='-1'>更新</span>
                <span class='button grass' on:click={() => renamePreset(preset)} on:keypress role='button' tabindex='-1'>重命名</span>
                <span class='button grass' on:click={() => deletePreset(preset)} on:keypress role='button' tabindex='-1'>删除</span>
              </div>
              <span
                class='preset-expand-icon db-icon-arrow-down'
                class:open={expandedPresetKey === preset.key}
                title='查看预设参数'
                on:click={() => togglePresetDetail(preset.key)}
                on:keypress
                role='button'
                tabindex='-1'
              ></span>
            </div>

            {#if expandedPresetKey === preset.key}
              <div class='preset-detail-list'>
                {#each getPresetDetailList(preset.options) as item}
                  <div class='preset-detail-item'>
                    <span>{item.label}</span>
                    <b>{item.value}</b>
                  </div>
                {/each}
              </div>
            {/if}
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
