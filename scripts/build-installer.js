const inno = require('innosetup-compiler');
const path = require('path');
const fs = require('fs');

const generateBitmaps = require('./generate-bitmaps');

async function build() {
  await generateBitmaps();

  const issPath = path.resolve(__dirname, '../installer/nisab-setup.iss');
  const outDir = path.resolve(__dirname, '../out/make/installer');

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
