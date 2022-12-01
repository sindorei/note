import type { SidebarConfig } from '@vuepress/theme-default'

export const sidebar: SidebarConfig = {
    '/frontend/': [
        {
            text: 'JavaScript设计模式',
            link: '/frontend/javascript/design_pattern/'
        },
        {
            text: '工程化',
            link: '/frontend/engineering/'
        }
    ],
    '/nodejs/': [
        {
            text: 'eggjs',
            link: '/nodejs/eggjs.html'
        }
    ],
    '/pl/': [
        {
            text: 'rust',
            link: '/pl/rust/start.html'
          },
          {
            text: 'go',
            link: '/pl/go.html'
          },
          {
            text: '汇编',
            link: '/pl/assembly/'
          }
    ],
    '/pl/swift/': [
        {
            text: 'swift',
            children: [
                '/pl/swift/types.md',
                '/pl/swift/operator.md',
                '/pl/swift/control_flow.md',
                '/pl/swift/function.md',
                '/pl/swift/closure.md',
            ]
        }
    ],
    '/pl/c++/': [
        {
            text: 'C++',
            children: [
                '/pl/c++/11-20.md',
            ]
        }
    ],
    '/pl/c++/qt': [
        {
            text: 'QT',
            children: [
                '/pl/c++/qt/qml_syntax.md',
            ]
        }
    ],
    '/language/': [
        {
            text: '英语',
            link: '/language/english'
        }
    ],
    '/os/linux/': [
        {
            text: 'linux',
            children: [
                '/os/linux/command.md',
            ]
        }
    ],
}
