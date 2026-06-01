export interface IFramePresetOptions {
  main_img_w_rate: number
  text_margin: number
  mini_top_bottom_margin: number
  radius: number
  radius_show: boolean
  shadow: number
  shadow_show: boolean
  quality: number
  bg_rate: { w: number; h: number }
  bg_rate_show: boolean
  bg_blur: number
  solid_bg: boolean
  solid_color: string
  landscape: boolean
  origin_wh_output: boolean
}

export interface IFramePreset {
  key: string
  name: string
  type: 'system' | 'custom'
  options: IFramePresetOptions
}

export const defPresets: IFramePreset[] = [
  {
    key: 'default-soft',
    name: '默认柔和',
    type: 'system',
    options: {
      main_img_w_rate: 90,
      text_margin: 0.4,
      mini_top_bottom_margin: 0,
      radius: 2.1,
      radius_show: true,
      shadow: 6,
      shadow_show: true,
      quality: 100,
      bg_rate: { w: 0, h: 0 },
      bg_rate_show: false,
      bg_blur: 100,
      solid_bg: false,
      solid_color: '#fff',
      landscape: false,
      origin_wh_output: false,
    },
  },
  {
    key: 'minimal-white',
    name: '极简白边',
    type: 'system',
    options: {
      main_img_w_rate: 88,
      text_margin: 0.45,
      mini_top_bottom_margin: 0,
      radius: 0,
      radius_show: false,
      shadow: 0,
      shadow_show: false,
      quality: 100,
      bg_rate: { w: 0, h: 0 },
      bg_rate_show: false,
      bg_blur: 0,
      solid_bg: true,
      solid_color: '#fff',
      landscape: false,
      origin_wh_output: false,
    },
  },
  {
    key: 'blur-bg',
    name: '模糊背景',
    type: 'system',
    options: {
      main_img_w_rate: 86,
      text_margin: 0.5,
      mini_top_bottom_margin: 0,
      radius: 2.4,
      radius_show: true,
      shadow: 8,
      shadow_show: true,
      quality: 100,
      bg_rate: { w: 0, h: 0 },
      bg_rate_show: false,
      bg_blur: 100,
      solid_bg: false,
      solid_color: '#fff',
      landscape: false,
      origin_wh_output: false,
    },
  },
  {
    key: 'xhs-4-5',
    name: '小红书 4:5',
    type: 'system',
    options: {
      main_img_w_rate: 84,
      text_margin: 0.55,
      mini_top_bottom_margin: 0.2,
      radius: 2.4,
      radius_show: true,
      shadow: 8,
      shadow_show: true,
      quality: 100,
      bg_rate: { w: 4, h: 5 },
      bg_rate_show: true,
      bg_blur: 100,
      solid_bg: false,
      solid_color: '#fff',
      landscape: false,
      origin_wh_output: false,
    },
  },
  {
    key: 'landscape-wide',
    name: '横版展示',
    type: 'system',
    options: {
      main_img_w_rate: 92,
      text_margin: 0.3,
      mini_top_bottom_margin: 0,
      radius: 1.8,
      radius_show: true,
      shadow: 5,
      shadow_show: true,
      quality: 100,
      bg_rate: { w: 16, h: 9 },
      bg_rate_show: true,
      bg_blur: 90,
      solid_bg: false,
      solid_color: '#fff',
      landscape: true,
      origin_wh_output: false,
    },
  },
  {
    key: 'fast-export',
    name: '快速导出',
    type: 'system',
    options: {
      main_img_w_rate: 90,
      text_margin: 0.4,
      mini_top_bottom_margin: 0,
      radius: 2,
      radius_show: true,
      shadow: 0,
      shadow_show: false,
      quality: 90,
      bg_rate: { w: 0, h: 0 },
      bg_rate_show: false,
      bg_blur: 40,
      solid_bg: false,
      solid_color: '#fff',
      landscape: false,
      origin_wh_output: false,
    },
  },
]

/**
 * 从当前配置选项中提取预设相关的参数
 */
export function extractPresetOptions(options: Record<string, any>): IFramePresetOptions {
  return {
    main_img_w_rate: options.main_img_w_rate,
    text_margin: options.text_margin,
    mini_top_bottom_margin: options.mini_top_bottom_margin,
    radius: options.radius,
    radius_show: options.radius_show,
    shadow: options.shadow,
    shadow_show: options.shadow_show,
    quality: options.quality,
    bg_rate: options.bg_rate ? { w: options.bg_rate.w, h: options.bg_rate.h } : { w: 0, h: 0 },
    bg_rate_show: options.bg_rate_show,
    bg_blur: options.bg_blur,
    solid_bg: options.solid_bg,
    solid_color: options.solid_color,
    landscape: options.landscape,
    origin_wh_output: options.origin_wh_output,
  }
}
