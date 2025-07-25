import EnvironmentPlugin from 'vite-plugin-environment'
import { buildSync } from 'esbuild'
import { defineConfig } from 'vite'
import { join } from 'node:path'
import fs from 'fs'
import path from 'path'
import pluginRewriteAll from 'vite-plugin-rewrite-all'
import postcssNesting from 'postcss-nesting'
import { createVuePlugin as vue } from 'vite-plugin-vue2'

const packageJson = fs.readFileSync('./package.json') as unknown as string
const appName = JSON.parse(packageJson).appName
const appVersion = JSON.parse(packageJson).version
const sbcName = JSON.parse(packageJson).sbcName
const sbcVersion = JSON.parse(packageJson).dependencies['sbc-common-components']
const aboutText1 = (appName && appVersion) ? `${appName} v${appVersion}` : ''
const aboutText2 = (sbcName && sbcVersion) ? `${sbcName} v${sbcVersion}` : ''
const generateAboutText = (aboutText1, aboutText2) => {
  if (aboutText1 && aboutText2) {
    return `"${aboutText1}<br>${aboutText2}"`
  } else if (aboutText1) {
    return `"${aboutText1}"`
  } else if (aboutText2) {
    return `"${aboutText2}"`
  } else {
    return ''
  }
}

export default defineConfig(({ mode }) => {
  const isLibBuild = mode === 'lib'
  return {
    define: {
      'import.meta.env.ABOUT_TEXT': generateAboutText(aboutText1, aboutText2)
    },
    envPrefix: 'VUE_APP_', // Need to remove this after fixing vaults. Use import.meta.env with VUE_APP.
    build: {
      sourcemap: true,
      lib: isLibBuild ? {
        entry: path.resolve(__dirname, 'src/lib-setup.js'),
        name: 'lib',
        formats: ['umd'],
        fileName: (format) => `lib.${format}.min.js`
      } : undefined,
      terserOptions: {
        keep_classnames: true,
        keep_fnames: true,
        format: {
          semicolons: false
        }
      },
      rollupOptions: {
        external: (request) => {
          // If library, use externals, otherwise the Vue/ composition-api instance in Auth-web will have issues.
          if (isLibBuild && (/^@vue\/composition-api$/.test(request) || /^vue$/.test(request))) {
            return true
          }
          return false
        }
      },
      outDir: 'dist',
      minify: isLibBuild ? 'terser' : false
    },
    plugins: [
      vue({
        vueTemplateOptions: {
          transformAssetUrls: {
            img: ['src', 'data-src'],
            'v-app-bar': ['image'],
            'v-avatar': ['image'],
            'v-banner': ['avatar'],
            'v-card': ['image'],
            'v-card-item': ['prependAvatar', 'appendAvatar'],
            'v-chip': ['prependAvatar', 'appendAvatar'],
            'v-img': ['src', 'lazySrc', 'srcset'],
            'v-list-item': ['prependAvatar', 'appendAvatar'],
            'v-navigation-bar': ['image'],
            'v-parallax': ['src', 'lazySrc', 'srcset'],
            'v-toolbar': ['image']
          }
        }
      }),
      EnvironmentPlugin({
        BUILD: 'web' // Fix for Vuelidate, allows process.env with Vite.
      }),
      postcssNesting,
      pluginRewriteAll(),
      {
        apply: 'build',
        enforce: 'post',
        transformIndexHtml () {
          buildSync({
            minify: true,
            bundle: true,
            entryPoints: [join(process.cwd(), 'service-worker.js')],
            outfile: join(process.cwd(), 'lib', 'service-worker.js')
          })
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '~': path.resolve(__dirname, './node_modules'),
        $assets: path.resolve(__dirname, './src/assets'),
        // Fix for bcrs-shared-components unit tests fail
        '@bcrs-shared-components/mixins': path.resolve(__dirname, './node_modules/@bcrs-shared-components/mixins/index.ts'),
        '@bcrs-shared-components/enums': path.resolve(__dirname, './node_modules/@bcrs-shared-components/enums/index.ts'),
        '@bcrs-shared-components/staff-comments': path.resolve(__dirname, './node_modules/@bcrs-shared-components/staff-comments/index.ts'),
        '@bcrs-shared-components/interfaces': path.resolve(__dirname, './node_modules/@bcrs-shared-components/interfaces/index.ts')
      },
      extensions: ['.js', '.ts', '.vue', '.json', '.css', '.mjs', '.jsx', 'tsx']
    },
    server: {
      port: 8080,
      host: true
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './tests/unit/setup.ts',
      threads: true,
      // hide Vue Devtools message
      onConsoleLog: function (log) {
        if (log.includes('Download the Vue Devtools extension')) {
          return false
        }
      },
      alias: {
        '@bcrs-shared-components/mixins': path.resolve(__dirname, './tests/unit/test-data/mock-mixins.ts')
      },
      server: {
        deps: {
          inline: [
            /@bcrs-shared-components\/.*/,
            /^@bcrs-shared-components$/,
            'sbc-common-components'
          ]
        }
      }
    },
    optimizeDeps: {
      // This needs to be done for FAS-UI and sbc-common-components to work.
      // Otherwise FAS complains about not having Vue.use(VueCompositionAPI)
      // sbc-common-components will fail at login.
      // Remove with Vue 3 for most of these.
      exclude: ['@vue/composition-api', 'sbc-common-components']
    }
  }
})
