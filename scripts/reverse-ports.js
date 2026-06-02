const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const ports = [8081, 5000, 9000, 7880, 3001];

// Find ADB path
let adbPath = 'adb';

function findAdb() {
  // 1. Try ANDROID_HOME / ANDROID_SDK_ROOT
  const sdkHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (sdkHome) {
    const p = path.join(sdkHome, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');
    if (fs.existsSync(p)) return p;
  }

  // 2. Try reading local.properties
  try {
    const localPropsPath = path.join(__dirname, '../android/local.properties');
    if (fs.existsSync(localPropsPath)) {
      const content = fs.readFileSync(localPropsPath, 'utf8');
      const match = content.match(/sdk\.dir\s*=\s*(.+)/);
      if (match) {
        let sdkDir = match[1].replace(/\\:/g, ':').replace(/\\\\/g, '\\').trim();
        const p = path.join(sdkDir, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');
        if (fs.existsSync(p)) return p;
      }
    }
  } catch (e) {}

  // 3. Try common default locations
  if (process.platform === 'win32') {
    const home = process.env.USERPROFILE || (process.env.HOMEDRIVE + process.env.HOMEPATH);
    const p = path.join(home, 'AppData', 'Local', 'Android', 'Sdk', 'platform-tools', 'adb.exe');
    if (fs.existsSync(p)) return p;
  } else {
    const home = process.env.HOME;
    const paths = [
      path.join(home, 'Library/Android/sdk/platform-tools/adb'),
      path.join(home, 'Android/Sdk/platform-tools/adb')
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) return p;
    }
  }

  return 'adb';
}

adbPath = findAdb();
console.log(`🔍 Using ADB path: "${adbPath}"`);
console.log('🔄 Fetching connected ADB devices...');

exec(`"${adbPath}" devices`, (err, stdout, stderr) => {
  if (err) {
    console.error('⚠️  Failed to run adb devices command:', err);
    return;
  }

  // Parse devices list
  const lines = stdout.split('\n');
  const devices = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && line.includes('device')) {
      const parts = line.split(/\s+/);
      devices.push(parts[0]);
    }
  }

  if (devices.length === 0) {
    console.log('⚠️  No connected ADB devices or emulators found.');
    return;
  }

  console.log(`📱 Found ${devices.length} connected device(s): ${devices.join(', ')}`);

  devices.forEach(device => {
    console.log(`🔄 Reversing ports for device [${device}]...`);
    ports.forEach(port => {
      exec(`"${adbPath}" -s ${device} reverse tcp:${port} tcp:${port}`, (err2, stdout2, stderr2) => {
        if (err2) {
          console.log(`⚠️  Could not reverse port ${port} for device ${device}`);
        } else {
          console.log(`✅ Port ${port} successfully reversed for device ${device}.`);
        }
      });
    });
  });
});
