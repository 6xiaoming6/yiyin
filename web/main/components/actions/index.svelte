<script lang='ts'>
  import type { IConfig, IFileInfo, ImgInfo, TInputEvent } from '../../interface'
  import { arrToObj, roundDecimalPlaces } from '@common/utils'
  import { ActionItem } from '@components'
  import { ColorPicker, Input, Message, Option, Select, Switch } from '@ggchivalrous/db-ui'
  import { config } from '@web/store/config'

  import { smoothIncrement } from '@web/util/util'

  import './index.scss'

  export let fileInfoList: IFileInfo[] = []

  let selectedId = ''
  let selectedPhoto: IFileInfo | undefined
  let previewShow = false
  let previewOptionsKey = ''
  let previewUrl = ''
  let previewLoading = false
  let previewTimer: NodeJS.Timeout

  $: {
    if (fileInfoList.length) {
      if (!selectedId || !fileInfoList.some(i => i.id === selectedId)) {
        selectedId = fileInfoList[0].id
      }
    }
    else {
      selectedId = ''
      previewUrl = ''
    }
  }

  $: selectedPhoto = fileInfoList.find(i => i.id === selectedId)
  $: previewShow = $config.options.preview_show
  $: previewOptionsKey = JSON.stringify($config.options)

  $: {
    // 当配置发生变化时，如果预览开启，则更新预览
    if (previewOptionsKey && previewShow && selectedId) {
      clearTimeout(previewTimer)
      previewTimer = setTimeout(updatePreview, 300)
    }
    else {
      clearTimeout(previewTimer)
      previewUrl = ''
    }
  }

  async function updatePreview() {
    if (!previewShow) return
    const file = fileInfoList.find(i => i.id === selectedId)
    if (!file) return

    previewLoading = true
    try {
      const res = await window.api.genPreview({ path: file.path, name: file.name })
      if (res && res.code === 0) {
        // 如果在请求过程中预览被关闭了，就不更新了
        if (previewShow) {
          previewUrl = res.data
        }
      }
      else if (res) {
        console.error('预览生成失败:', res.message)
        previewUrl = ''
      }
    }
    catch (e) {
      console.error('预览生成失败:', e)
    }
    finally {
      previewLoading = false
    }
  }

  function selectImage(id: string) {
    selectedId = id
  }

  $: photoStatusText = (() => {
    if (!selectedPhoto) return ''
    progressTick
    return imgInfoRecord[selectedPhoto.id]?.progress >= 100 ? '已完成' : '待处理'
  })()

  function getItemStatus(id: string) {
    progressTick
    return imgInfoRecord[id]?.progress >= 100 ? '已完成' : '待处理'
  }

  const labelWidth = '110px'

  let handleCount = 0
  let photoDropdownOpen = false
  let imgInfoRecord: Record<string, ImgInfo> = {}
  let progressTick = 0

  $: onFileInfoList(fileInfoList)
  $: getHandleCount(imgInfoRecord)
  $: selectedPhoto && progressTick

  window.api['on:progress']((data: Pick<ImgInfo, 'id' | 'progress'>) => {
    if (imgInfoRecord[data.id]) {
      if (imgInfoRecord[data.id].closeInterval) {
        imgInfoRecord[data.id].closeInterval()
      }

      imgInfoRecord[data.id].closeInterval = smoothIncrement(
        imgInfoRecord[data.id].progress,
        data.progress,
        10,
        (n) => {
          imgInfoRecord[data.id].progress = n
          progressTick++
        },
      )
    }
  })

  window.api['on:faildTask']((data: { id: string, msg: string }) => {
    if (!imgInfoRecord[data.id]) {
      return
    }

    imgInfoRecord[data.id].faild = true
    imgInfoRecord[data.id].faildMsg = data.msg
  })

  function getHandleCount(_imgInfoRecord: typeof imgInfoRecord) {
    handleCount = Object.values(_imgInfoRecord).filter(i => i.progress === 100 || i.faild).length
  }

  function onFileInfoList(list: IFileInfo[]) {
    imgInfoRecord = arrToObj(list, 'id', i => ({
      ...i,
      interval: null,
      progress: 0,
      exif: null,
      faild: false,
      faildMsg: '',
      ...imgInfoRecord[i.id],
    }))
  }

  async function changeOutputPath() {
    const data = await window.api['open:selectPath']()
    if (data.code === 0 && data.data.output) {
      $config.output = data.data.output
      $config.outputMode = data.data.outputMode
    }
  }

  async function resetOutputPath() {
    const res = await window.api.getDefaultOutput()
    if (res.code === 0 && typeof res.data === 'string') {
      $config.output = res.data
    }
  }

  function resetOutputName() {
    $config.outputNameTemplate = '${filename}_watermark'
  }

  function onBGRateChange(e: CustomEvent<boolean>) {
    if (e.detail) {
      config.update((d) => {
        d.options.landscape = false
        return d
      })
    }
  }

  const numReg = /-?\d+\.?\d{0,3}/
  function onNumInputChange(v: TInputEvent, key: keyof IConfig['options'], max: number, min: number, decimal?: number) {
    let _v = v.currentTarget.value
    const match = _v.match(numReg)

    if (match && match.length) {
      _v = match[0]
    }

    let num = +_v
    if (Number.isNaN(num)) num = min
    else if (num < min) num = min
    else if (num > max) num = max

    num = typeof decimal === 'number' ? roundDecimalPlaces(num, decimal) : num;
    ($config.options[key] as number) = num
    v.currentTarget.value = `${num}`
  }

  function switchBgRate() {
    config.update((d) => {
      d.options.bg_rate = {
        w: d.options.bg_rate.h,
        h: d.options.bg_rate.w,
      }
      return d
    })
  }

  async function getExitInfo(id: string, path: string) {
    if (imgInfoRecord[id].exif !== null) {
      return imgInfoRecord[id].exif
    }

    const info = await window.api.getExitInfo(path)
    imgInfoRecord[id].exif = info.data || undefined

    return info.data
  }

  async function cpExif(id: string, path?: string) {
    const record = imgInfoRecord[id]
    const filePath = path || fileInfoList.find(i => i.id === id)?.path

    if (!record || !filePath) {
      return Message.error('图片信息不存在！')
    }

    if (record.exif === null) {
      record.exif = await getExitInfo(id, filePath)
    }

    if (!record.exif) {
      return Message.error('图片信息不存在！')
    }

    navigator.clipboard.writeText(JSON.stringify(record.exif, null, 2))
    return Message.success('相机信息已复制到粘贴板')
  }

  async function clearImgInfo() {
    const res = await window.api.drainQueue()
    if (res.code !== 0) {
      Message.error(`清空失败！${res.message || ''}`)
      return
    }

    Message.success('清空成功')
    fileInfoList = []
  }
</script>

<div class='app-action-wrap'>
  <div class='app-action-left-wrap'>
    <ActionItem {labelWidth} title='输出目录'>
      <svelte:fragment slot='popup'>
        选择图片输出目录的模式
        <br>
        <b>默认路径：</b>系统图片目录下的 watermark 文件夹
        <br>
        <b>当前文件夹：</b>与源图片相同目录
        <br>
        <b>./watermark：</b>源图片目录下的 watermark 子文件夹
        <br>
        <b>./文件名.watermark：</b>以源文件名命名的子文件夹
        <br>
        <b>自定义路径：</b>自定义输出路径（支持 {'${filename}'} 变量）
      </svelte:fragment>
      <Select size='mini' bind:value={$config.outputMode} class='output-mode-select no-drag'>
        <Option value='default' label='默认路径'></Option>
        <Option value='sourceFolder' label='当前文件夹(./)'></Option>
        <Option value='sourceSubfolder' label='./watermark文件夹'></Option>
        <Option value='sourceNameSubfolder' label={'./${filename}.watermark文件夹'}></Option>
        <Option value='custom' label='自定义路径'></Option>
      </Select>
    </ActionItem>

    {#if $config.outputMode === 'custom'}
      <div class='output-custom-row'>
        <Input
          size='mini'
          class='text-input output-path-input'
          bind:value={$config.output}
          placeholder="输入或选择输出路径（支持 {'${filename}'} 变量）"
        />
        <span
          class='db-icon-folder-opened output-action-icon'
          title='选择文件夹'
          on:click|stopPropagation={changeOutputPath}
          on:keypress
          role='button'
          tabindex='-1'
        />
        <span
          class='db-icon-refresh output-action-icon'
          title='使用默认路径'
          on:click|stopPropagation={resetOutputPath}
          on:keypress
          role='button'
          tabindex='-1'
        />
      </div>
    {/if}

    <ActionItem {labelWidth} title='输出文件名'>
      <svelte:fragment slot='popup'>
        设置输出文件名的模板，支持以下变量：
        <br>
        {'${filename}'} - 原文件名
        <br>
        {'${ext}'} - 原扩展名
        <br>
        {'${date}'} - 日期(YYYYMMDD)
        <br>
        {'${time}'} - 时间(HHMMSS)
        <br>
        {'${datetime}'} - 日期时间
        <br>
        {'${random}'} - 随机字符串
        <br>
        默认：{'${filename}'}_watermark.jpg
      </svelte:fragment>
      <Input
        size='mini'
        class='text-input'
        style='flex: 1;'
        bind:value={$config.outputNameTemplate}
        placeholder={'${filename}' + '_watermark'}
      />
      <span
        class='db-icon-refresh output-action-icon'
        style='font-size: 16px; margin-left: 6px;'
        title='使用默认配置'
        on:click|stopPropagation={resetOutputName}
        on:keypress
        role='button'
        tabindex='-1'
      />
    </ActionItem>

    <ActionItem {labelWidth} title='主图占比'>
      <svelte:fragment slot='popup'>
        指定主图对背景宽度的占比（可以调节左右边框的宽度）
        <br>
        默认主图占背景的90%
      </svelte:fragment>
      <input
        class='input'
        type='text'
        value={$config.options.main_img_w_rate}
        style='width: 103px;'
        on:change={v => onNumInputChange(v, 'main_img_w_rate', 100, 1, 0)}
      />
    </ActionItem>

    <ActionItem {labelWidth} title='文本间距'>
      <svelte:fragment slot='popup'>
        指定文本上下间距（临时性功能，后续会去掉）
        <br>
        默认0.4
      </svelte:fragment>
      <input
        class='input'
        type='text'
        value={$config.options.text_margin}
        style='width: 103px;'
        on:change={v => onNumInputChange(v, 'text_margin', 10000, 0, 2)}
      />
    </ActionItem>

    <ActionItem {labelWidth} title='最小上下边距'>
      <svelte:fragment slot='popup'>
        指定水印上下边距的最小值，默认情况使用阴影宽度作为上下边距
        <br>
        设置最小上下边距，将会从它和阴影之间取最大值
        <br>
        按照背景高度比例换算，值为 0-100
        <br>
        默认：0
      </svelte:fragment>
      <input
        class='input'
        type='text'
        value={$config.options.mini_top_bottom_margin}
        style='width: 103px;'
        on:change={v => onNumInputChange(v, 'mini_top_bottom_margin', 100, 0, 2)}
      />
    </ActionItem>

    <ActionItem {labelWidth} title='圆角大小'>
      <svelte:fragment slot='popup'>
        指定圆角的大小，不指定则为直角
        <br>
        取值范围: 0 - 50
        <br>
        默认值: 2.1
      </svelte:fragment>
      <Switch bind:value={$config.options.radius_show} />
      <input
        class='input'
        type='text'
        value={$config.options.radius}
        style='width: 103px;'
        on:change={v => onNumInputChange(v, 'radius', 50, 0, 1)}
      />
    </ActionItem>

    <ActionItem {labelWidth} title='阴影大小'>
      <svelte:fragment slot='popup'>
        指定阴影的大小，不指定则无阴影
        <br>
        设置的值为图片高度的百分比，例如: 1，则为0.01%
        <br>
        默认值：6
      </svelte:fragment>
      <Switch bind:value={$config.options.shadow_show} />
      <input
        class='input'
        type='text'
        value={$config.options.shadow}
        style='width: 103px;'
        on:change={v => onNumInputChange(v, 'shadow', 50, 0, 1)}
      />
    </ActionItem>

    <ActionItem {labelWidth} title='输出质量'>
      <svelte:fragment slot='popup'>
        指定输出质量，只允许整数
        <br>
        默认值：100
      </svelte:fragment>
      <input
        class='input'
        type='text'
        value={$config.options.quality}
        style='width: 103px;'
        on:change={v => onNumInputChange(v, 'quality', 100, 1, 0)}
      />
    </ActionItem>

    <ActionItem {labelWidth} title='输出宽高比'>
      <svelte:fragment slot='popup'>
        指定输出的图片的宽高比(该比例只生效于背景，对原图不生效)
        <br>
        该选项生效后影响以下选项效果：
        <br>
        <b>横屏输出：</b>失效
      </svelte:fragment>
      <Switch bind:value={$config.options.bg_rate_show} on:change={onBGRateChange} />
      <input class='input' style='width: 40px; margin-right: 4px;' type='text' bind:value={$config.options.bg_rate.w} />
      <i class='switch icon db-icon-sort' on:click={switchBgRate} role='button' tabindex='-1' on:keypress />
      <input class='input' style='width: 40px; margin-left: 5px;' type='text' bind:value={$config.options.bg_rate.h} />
    </ActionItem>

    <ActionItem {labelWidth} title='背景模糊'>
      <svelte:fragment slot='popup'>
        指定背景图片的模糊程度
        <br>
        取值范围: 0 - 100
        <br>
        默认值: 15
      </svelte:fragment>
      <input
        class='db-slider'
        type='range'
        min='0'
        max='100'
        step='1'
        bind:value={$config.options.bg_blur}
        style='margin-right: 8px;'
      />
      <input
        class='input'
        type='text'
        value={$config.options.bg_blur}
        style='width: 30px;'
        on:change={v => onNumInputChange(v, 'bg_blur', 100, 0, 0)}
      />
      <span style='font-size: 12px; margin-left: 2px;'>%</span>
    </ActionItem>

    <ActionItem {labelWidth} title='纯色背景'>
      <svelte:fragment slot='popup'>使用纯色背景，默认使用图片模糊做背景</svelte:fragment>
      <Switch bind:value={$config.options.solid_bg} />
      {#if $config.options.solid_bg}
        <ColorPicker bind:value={$config.options.solid_color} size='mini' />
      {/if}
    </ActionItem>

    <ActionItem {labelWidth} title='横屏输出'>
      <svelte:fragment slot='popup'>
        软件自己判断图片宽高那一边更长
        <br>
        将背景横向处理
        <br>
        适合竖图生成横屏图片
      </svelte:fragment>
      <Switch bind:value={$config.options.landscape} disabled={$config.options.bg_rate_show} />
    </ActionItem>

    <ActionItem {labelWidth} title='快速输出'>
      <svelte:fragment slot='popup'>
        开启后选择图片/拖拽图片到软件将直接输出水印图片无需点击生成按钮
      </svelte:fragment>
      <Switch bind:value={$config.options.iot} />
    </ActionItem>

    <ActionItem {labelWidth} title='实时预览'>
      <svelte:fragment slot='popup'>
        开启后点击列表图片可实时预览水印效果
      </svelte:fragment>
      <Switch bind:value={$config.options.preview_show} />
    </ActionItem>
  </div>

  <div class='app-action-right-wrap'>
    <div class='image-list-wrap'>
      <div class='preview-wrap grass-inset'>
          {#if !fileInfoList.length}
            <div class='preview-placeholder'>添加图片后在这里预览</div>
          {:else if !$config.options.preview_show}
            <div class='preview-placeholder'>开启实时预览后显示效果</div>
          {:else if previewLoading}
            <div class='preview-loading'>
              <i class='db-icon-loading icon-loading'></i>
              生成预览中...
            </div>
          {:else if previewUrl}
            <img class='preview-img' src={previewUrl} alt='预览图' />
          {:else}
            <div class='preview-placeholder'>预览图生成失败</div>
          {/if}
      </div>

      {#if false}
      <div class='img-wrap grass-inset'>
        <div class='img-list'>
          {#each fileInfoList as i (i.id)}
            {@const record = imgInfoRecord[i.id]}
            {#key i.id}
              <div
                class='img-item {selectedId === i.id ? 'selected' : ''}'
                on:click={() => selectImage(i.id)}
                on:keypress
                role='button'
                tabindex='-1'
              >
                <div class='img-item-head'>
                  <span class='img-name'>{i.name}</span>
                  {#if record.faild}
                    <i class='db-icon-error error'></i>
                  {:else if record.progress < 100}
                    <span
                      style='font-weight: bold;'
                      class={record.progress === 100 ? 'success' : ''}
                    >{record.progress}%</span>
                  {:else}
                    <i class='db-icon-success success'></i>
                  {/if}
                </div>
                <div class='img-item-info'>
                  相机信息:
                  {#await getExitInfo(i.id, i.path)}
                    <i class='db-icon-loading'></i>
                  {:then v}
                    {#if v}
                      <i class='db-icon-success success'></i>
                      <i class='icon db-icon-document-copy' on:click={() => cpExif(i.id)} on:keypress role='button' tabindex='-1'></i>
                    {:else}
                      <i class='db-icon-error error'></i>
                    {/if}
                  {/await}
                </div>

                <div class='img-item-faild-msg'>
                  {record.faildMsg}
                </div>
              </div>
            {/key}
          {/each}
        </div>
      </div>
      {/if}

      <div class='task-action'>
        <ActionItem title='图片数量'>{fileInfoList.length}</ActionItem>
        <ActionItem title='完成数量'>{handleCount}</ActionItem>
        {#if fileInfoList.length}
          <div class='photo-dropdown no-drag' class:open={photoDropdownOpen}>
            <div
              class='photo-dropdown-trigger'
              on:click={() => { photoDropdownOpen = !photoDropdownOpen }}
              on:keypress
              role='button'
              tabindex='-1'
            >
              {#if selectedPhoto}
                {@const selectedRecord = imgInfoRecord[selectedPhoto.id]}
                <span class='photo-name'>{selectedPhoto.name}</span>
                <span class='photo-status'>- {photoStatusText}</span>
                <span class='photo-status-icon' class:done={selectedRecord?.progress >= 100}>
                  {#if selectedRecord?.progress > 0 && selectedRecord?.progress < 100}
                    {Math.round(selectedRecord.progress)}%
                  {:else if selectedRecord?.progress >= 100}
                    <i class='db-icon-success'></i>
                  {:else}
                    <i class='db-icon-error'></i>
                  {/if}
                </span>
              {/if}
              <i class='photo-arrow db-icon-arrow-down'></i>
            </div>

            {#if photoDropdownOpen}
              <div class='photo-dropdown-menu grass'>
                {#each fileInfoList as i (i.id)}
                  {@const record = imgInfoRecord[i.id]}
                  <div
                    class='photo-option'
                    class:selected={selectedId === i.id}
                    on:click={() => { selectImage(i.id); photoDropdownOpen = false }}
                    on:keypress
                    role='button'
                    tabindex='-1'
                  >
                    <div class='photo-main-line'>
                      <span class='photo-name'>{i.name}</span>
                      <span class='photo-status'>- {getItemStatus(i.id)}</span>
                      <span class='photo-status-icon' class:done={record?.progress >= 100}>
                        {#if record?.progress > 0 && record?.progress < 100}
                          {Math.round(record.progress)}%
                        {:else if record?.progress >= 100}
                          <i class='db-icon-success'></i>
                        {:else}
                          <i class='db-icon-error'></i>
                        {/if}
                      </span>
                    </div>
                    <div class='photo-camera-info'>
                      相机信息:
                      {#await getExitInfo(i.id, i.path)}
                        <i class='db-icon-loading'></i>
                      {:then v}
                        {#if v}
                          <i class='db-icon-success success'></i>
                          <i
                            class='photo-copy icon db-icon-document-copy'
                            title='复制相机信息'
                            on:click|stopPropagation={() => cpExif(i.id, i.path)}
                            on:keypress
                            role='button'
                            tabindex='-1'
                          ></i>
                        {:else}
                          <i class='db-icon-error error'></i>
                        {/if}
                      {/await}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
          <div class='button' on:click={clearImgInfo} on:keypress role='button' tabindex='-1'>清空</div>
        {/if}
      </div>

    </div>

  </div>
</div>
