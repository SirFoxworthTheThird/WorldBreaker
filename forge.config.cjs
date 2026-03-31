module.exports = {
  packagerConfig: {
    name: 'PlotWeave',
    executableName: 'PlotWeave',
    icon: './public/favicon',
    asar: true,
    // Only include what the app needs to run — exclude source, tests, dev config
    ignore: [
      /^\/src/,
      /^\/public/,
      /^\/screenshots/,
      /^\/background/,
      /^\/icon/,
      /^\/layout/,
      /^\/coverage/,
      /^\/\.github/,
      /^\/\.claude/,
      /^\/node_modules\/\.cache/,
      /\.(test|spec)\.(ts|tsx|js|cjs)$/,
      /^\/vite\.config/,
      /^\/tsconfig/,
      /^\/eslint\.config/,
      /^\/vitest/,
    ],
  },
  makers: [
    {
      // Windows — produces a Setup.exe installer
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'PlotWeave',
        authors: 'PlotWeave',
        description: 'A local story and world-building tracker',
      },
    },
    {
      // macOS — produces a .zip (no code signing required)
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      // Linux — produces a .deb package (Debian/Ubuntu)
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'PlotWeave',
          homepage: 'https://github.com/SirFoxworthTheThird/PlotWeave',
          description: 'A local story and world-building tracker',
        },
      },
    },
    {
      // Linux — produces a .rpm package (Fedora/RHEL)
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          homepage: 'https://github.com/SirFoxworthTheThird/PlotWeave',
          description: 'A local story and world-building tracker',
        },
      },
    },
  ],
}
