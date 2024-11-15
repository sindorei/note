import { defineUserConfig } from 'vuepress'
import { defaultTheme } from '@vuepress/theme-default'
import { viteBundler } from '@vuepress/bundler-vite'
import { sidebar } from './sidebar'
export default defineUserConfig({
  lang: 'zh-CN',
  title: '笔记',
  description: '学习及练习的记录',
  base: '/note/',
  bundler: viteBundler(),
  theme: defaultTheme({
    sidebarDepth: 1,
    sidebar,
    colorMode: 'dark',
    colorModeSwitch: false,
  }),
  
})