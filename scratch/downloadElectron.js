const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const url = 'https://npmmirror.com/mirrors/electron/v22.3.27/electron-v22.3.27-win32-x64.zip';
const zipPath = path.resolve(__dirname, 'electron-v22.zip');
const distPath = path.resolve(__dirname, '../node_modules/electron/dist');
const pathTxt = path.resolve(__dirname, '../node_modules/electron/path.txt');

console.log('Downloading Electron 22.3.27 from npmmirror...');

function download(targetUrl) {
  https.get(targetUrl, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log('Redirecting to:', res.headers.location);
      return download(res.headers.location);
    }

    if (res.statusCode !== 200) {
      console.error('Download failed with status:', res.statusCode);
      process.exit(1);
    }

    const totalBytes = parseInt(res.headers['content-length'], 10);
    console.log(`Total size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);

    const fileStream = fs.createWriteStream(zipPath);
    let downloadedBytes = 0;
    let lastLoggedPct = 0;

    res.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      const pct = Math.floor((downloadedBytes / totalBytes) * 100);
      if (pct >= lastLoggedPct + 25) {
        lastLoggedPct = pct;
        console.log(`Progress: ${pct}%`);
      }
    });

    res.pipe(fileStream);

    fileStream.on('finish', () => {
      fileStream.close();
      console.log('Download complete!');
      const stat = fs.statSync(zipPath);
      console.log(`File on disk: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);

      if (stat.size < totalBytes * 0.99) {
        console.error('File incomplete!');
        process.exit(1);
      }

      console.log('Extracting using tar to:', distPath);
      if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath, { recursive: true });
      }

      execSync(`tar -xf "${zipPath}" -C "${distPath}"`, { stdio: 'inherit' });
      fs.writeFileSync(pathTxt, 'electron.exe', 'utf8');
      fs.unlinkSync(zipPath);
      console.log('SUCCESS! Electron 22.3.27 extracted.');
    });
  }).on('error', (err) => {
    console.error('Network error:', err);
    process.exit(1);
  });
}

download(url);
