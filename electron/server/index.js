const { ipcMain } = require('electron');
const fs = require('fs');
const Buffer = require('Buffer').Buffer;

ipcMain.on('asynchronous-message', (event, arg) => {
  console.log(arg)  // prints "ping"
  event.sender.send('asynchronous-reply', 'pong')
})

ipcMain.on('imgToSteam', (event, base64Str) => {
  let buf = Buffer.from(base64Str);
  fs.writeFile('./new.png', buf, (err) => {
    err ? console.log(err) : null
  })
  // console.log(buf);
  // event.sender.send('img', parseInt(base64Str, '16'))
})