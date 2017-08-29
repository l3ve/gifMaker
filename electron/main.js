var { app, BrowserWindow, Menu } = require('electron');
var { WINDOW_WIDTH, WINDOW_HEIGHT } = require('./config.json');
var { buildFromTemplate } = require('./menu.js');
var menu = Menu.buildFromTemplate(buildFromTemplate);

global.mainWindow = null;

function createWindow() {
  Menu.setApplicationMenu(menu);
  global.mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT
    // type: 'desktop',
    // titleBarStyle: 'hidden'
  });
  global.mainWindow.loadURL(`file://${__dirname}/index.html`);
  // 启用开发工具。
  global.mainWindow.openDevTools();
  // 启用服务
  require('./server');
  require('./opencv');
  console.log(`当前node版本 : ${process.version}`);
  global.mainWindow.on('closed', () => {
    global.mainWindow = null;
    app.quit();
  });
}


app.on('ready', createWindow);

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // 在 macOS 上，当点击 dock 图标并且该应用没有打开的窗口时，
  // 绝大部分应用会重新创建一个窗口。
  if (global.mainWindow === null) {
    createWindow();
  }
});

// app.setBadgeCount(10)//提示新消息
app.dock.bounce();
