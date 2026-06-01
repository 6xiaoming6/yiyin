<script lang='ts'>
  import { Dialog, Input } from '@ggchivalrous/db-ui'

  export let visible = false
  export let title = ''
  export let name = ''

  /** 确认回调，参数为预设名称 */
  export let onConfirm: (name: string) => void = () => {}

  let inputName = ''
  let nameError = ''

  $: if (visible) {
    inputName = name
    nameError = ''
  }

  function onSave() {
    const trimmed = (inputName || '').trim()
    nameError = trimmed ? '' : '名称不能为空'

    if (nameError) return

    onConfirm(trimmed)
    visible = false
  }
</script>

<Dialog
  class='custom-param-dialog'
  {title}
  bind:visible
  appendToBody
  width='400px'
  top='8vh'
>
  <div class='preset-dialog-body'>
    <div class='form-item'>
      <div class='form-item-label'>预设名称</div>
      <div class='form-item-content'>
        <Input
          class={nameError ? 'text-input input-error' : 'text-input'}
          bind:value={inputName}
          placeholder={nameError || '请输入预设名称'}
          on:input={() => nameError = ''}
        />
      </div>
    </div>
  </div>

  <footer>
    <div class='button grass' on:click={() => (visible = false)} on:keypress role='button' tabindex='-1'>取 消</div>
    <div class='button grass' on:click={onSave} on:keypress role='button' tabindex='-1'>保 存</div>
  </footer>
</Dialog>

<style>
  :global(.input-error .db-input__inner::placeholder) {
    color: var(--error-color);
  }
</style>
