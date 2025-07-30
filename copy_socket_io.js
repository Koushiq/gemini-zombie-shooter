const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, 'node_modules', 'socket.io', 'client-dist', 'socket.io.js');
const destinationPath = path.join(__dirname, 'public', 'socket.io.js');

try {
    fs.copyFileSync(sourcePath, destinationPath);
    console.log('socket.io.js copied successfully!');
} catch (err) {
    console.error('Error copying socket.io.js:', err);
}