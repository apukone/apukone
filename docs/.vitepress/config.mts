import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Apukone Docs",
    description: "Distributed AI Inference Documentation",
    base: '/docs/',
    srcDir: '.',
    outDir: './.vitepress/dist',
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Guide', link: '/guide/getting-started' },
            { text: 'App', link: '../../../', target: '_self', rel: false } // Link back to main app
        ],

        sidebar: [
            {
                text: 'Introduction',
                items: [
                    { text: 'Getting Started', link: '/guide/getting-started' },
                    { text: 'Architecture', link: '/guide/architecture' }
                ]
            },
            {
                text: 'Reference',
                items: [
                    { text: 'Client SDK', link: '/reference/client-sdk' },
                    { text: 'API', link: '/reference/api' }
                ]
            }
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/apukone/apukone' }
        ]
    }
})
