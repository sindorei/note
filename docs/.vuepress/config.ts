import { defineUserConfig, defaultTheme } from 'vuepress'

export default defineUserConfig({
  lang: 'zh-CN',
  title: '笔记',
  description: '平时学习及练习是时的记录',
  base: '/note/',
  theme: defaultTheme({
    sidebarDepth: 2,
    sidebar: [
      {
        text: '前端',
        children: [
          {
            text: 'JavaScript设计模式',
            link: '/frontend/javascript/design_pattern/'
          },
          {
            text: '工程化',
            link: '/frontend/engineering/'
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
      },
      {
        text: '语言',
        children: [
          {
            text: '英语',
            link: '/language/english'
          }
        ]
      }
    ]
  }),
})