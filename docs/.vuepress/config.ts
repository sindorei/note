import { defineUserConfig, defaultTheme } from 'vuepress'
import { sidebar } from './sidebar'
export default defineUserConfig({
  lang: 'zh-CN',
  title: '笔记',
  description: '平时学习及练习是时的记录',
  base: '/note/',
  theme: defaultTheme({
    sidebarDepth: 1,
    sidebar,
  }),
})