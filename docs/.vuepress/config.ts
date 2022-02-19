import { defineUserConfig } from 'vuepress'
import type { DefaultThemeOptions } from 'vuepress'

export default defineUserConfig<DefaultThemeOptions>({
  lang: 'zh-CN',
  title: '笔记',
  description: '平时学习及练习是时的记录',
  base: '/note/',
  theme: '@vuepress/theme-default',
  themeConfig: {
    logo: 'https://vuejs.org/images/logo.png',
    sidebarDepth: 2,
    sidebar: [
      {
        text: '前端',
        children: [
          {
            text: 'JavaScript设计模式',
            link: '/frontend/javascript/design_pattern/'
          }
        ]
      },
      {
        text: 'NodeJs',
        children: [
          {
            text: 'eggjs',
            link: '/nodejs/eggjs.html'
          }
        ]
      },
      {
        text: '编程语言',
        children: [
          {
            text: 'rust',
            link: '/pl/rust/start.html'
          },
          {
            text: 'swift',
            link: '/pl/swift/doc.html'
          },
          {
            text: 'go',
            link: '/pl/go.html'
          },
          {
            text: '汇编',
            link: '/pl/assembly/'
          }
        ]
      }
    ]
  },
})