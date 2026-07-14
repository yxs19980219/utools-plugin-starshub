const fs = require('fs');

// 拷贝 preload.js 和 logo.png 到 dist/
fs.copyFileSync('preload.js', 'dist/preload.js');
fs.copyFileSync('logo.png', 'dist/logo.png');

// 拷贝 plugin.json 并修改 main 为 index.html
const pkg = JSON.parse(fs.readFileSync('plugin.json', 'utf8'));
pkg.main = 'index.html';
fs.writeFileSync('dist/plugin.json', JSON.stringify(pkg, null, 4));

console.log('dist 打包就绪');
