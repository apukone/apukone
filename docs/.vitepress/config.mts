import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Apukone Docs",
    description: "Distributed AI Inference Documentation",
    base: '/docs/',
    srcDir: '.',
    outDir: './.vitepress/dist',

    locales: {
        root: {
            label: 'Suomi',
            lang: 'fi',
            themeConfig: {
                nav: [
                    { text: 'Etusivu', link: '/' },
                    { text: 'Opas', link: '/asennus' },
                    { text: 'App', link: '../../../', target: '_self' }
                ],
                sidebar: [
                    {
                        text: 'Johdanto',
                        items: [
                            { text: 'Asennus', link: '/asennus' },
                            { text: 'Käyttö', link: '/kaytto' },
                            { text: 'Ominaisuudet', link: '/ominaisuudet' },
                            { text: 'Järjestelmä', link: '/jarjestelma' }
                        ]
                    },
                    {
                        text: 'Viitteet',
                        items: [
                            { text: 'Rajapinnat (API)', link: '/rajapinnat' }
                        ]
                    }
                ]
            }
        },
        en: {
            label: 'English',
            lang: 'en',
            link: '/en/',
            themeConfig: {
                nav: [
                    { text: 'Home', link: '/en/' },
                    { text: 'Guide', link: '/en/installation' },
                    { text: 'App', link: '../../../', target: '_self' }
                ],
                sidebar: [
                    {
                        text: 'Introduction',
                        items: [
                            { text: 'Installation', link: '/en/installation' },
                            { text: 'Usage', link: '/en/usage' },
                            { text: 'Features', link: '/en/features' },
                            { text: 'System', link: '/en/system' }
                        ]
                    },
                    {
                        text: 'Reference',
                        items: [
                            { text: 'API Reference', link: '/en/api' }
                        ]
                    }
                ]
            }
        }
    },

    themeConfig: {
        socialLinks: [
            { icon: 'github', link: 'https://github.com/apukone/apukone' }
        ]
    }
})
