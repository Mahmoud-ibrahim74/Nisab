const inno = require('innosetup-compiler');
const path = require('path');
const fs = require('fs');

const generateBitmaps = require('./generate-bitmaps');
const { execSync } = require('child_process');

async function build() {
  const appDir = path.resolve(__dirname, '../build-out/Nisab-win32-x64');
  const exePath = path.resolve(appDir, 'Nisab.exe');

  if (!fs.existsSync(exePath)) {
    console.log('Packaged application not found. Running "npm run package"...');
    execSync('npm run package', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
  }

  await generateBitmaps();

  const issPath = path.resolve(__dirname, '../installer/nisab-setup.iss');
  const outDir = path.resolve(__dirname, '../build-out/make/installer');

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('Compiling Inno Setup installer from:', issPath);

  return new Promise((resolve, reject) => {
    inno(issPath, { verbose: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

build()
  .then(() => {
    console.log('✓ Nisab Windows Setup installer compiled successfully!');
  })
  .catch((err) => {
    console.error('✗ Inno Setup compilation failed:', err);
    process.exit(1);
  });
