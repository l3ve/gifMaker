const { ipcMain } = require('electron');
const fs = require('fs');
const Buffer = require('Buffer').Buffer;

ipcMain.on('asynchronous-message', (event, arg) => {
  console.log(arg)  // prints "ping"
  event.sender.send('asynchronous-reply', 'pong')
})

ipcMain.on('imgToSteam', (event, base64Str) => {
  let buf = Buffer.from(base64Str, 'base64');
  console.log(buf);
  event.sender.send('img', buf.toString('binary'))
})