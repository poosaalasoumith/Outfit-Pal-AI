import { spawn } from 'child_process';
import fs from 'fs';
const out = fs.openSync('./out.log', 'w');
const err = fs.openSync('./err.log', 'w');
const child = spawn('cmd.exe', ['/c', 'npm run dev'], {
  detached: true,
  stdio: ['ignore', out, err]
});
console.log('Server started with PID: ' + child.pid);
child.unref();
