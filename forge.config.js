const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

const path = require('path');

module.exports = {
  packagerConfig: {
    electronVersion: '22.3.27',
    download: {
      unsafelyDisableChecksums: true,
    },
    asar: true,
    name: 'Nisab',
    executableName: 'Nisab',
    appBundleId: 'com.nisab.app',
    appVersion: '1.0.0',
    buildVersion: '1.0.0',
    appCopyright: 'Copyright © 2026 Nisab (emthanyplatform-eg)',
    icon: path.resolve(__dirname, 'src/assets/icon'),
    win32metadata: {
      CompanyName: 'emthanyplatform-eg',
      FileDescription: 'نصاب (Nisab) - تطبيق إسلامي شامل للقرآن الكريم، الأذكار، مواقيت الصلاة، متابعة الختمة، وحساب الزكاة',
      OriginalFilename: 'Nisab.exe',
      ProductName: 'Nisab',
      InternalName: 'Nisab',
      legalCopyright: 'Copyright © 2026 Nisab (emthanyplatform-eg)'
    },
    ignore: [
      /\.git/,
      /scratch/,
      /scripts/
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'Nisab',
        title: 'Nisab',
        authors: 'emthanyplatform-eg',
        description: 'نصاب (Nisab) - تطبيق إسلامي شامل للقرآن الكريم، الأذكار، مواقيت الصلاة، متابعة الختمة، وحساب الزكاة',
        version: '1.0.0',
        setupIcon: path.resolve(__dirname, 'src/assets/icon.ico'),
        setupExe: 'Nisab-1.0-Setup.exe',
        loadingGif: path.resolve(__dirname, 'src/assets/install-spinner.gif'),
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses for application hardening compatible with Electron 22
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
