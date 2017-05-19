const webpack = require('webpack');
const path = require('path');
const poststylus = require('poststylus');
const autoprefixer = require('autoprefixer');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const plugins = [
  new webpack.NoEmitOnErrorsPlugin(),
  new ExtractTextPlugin('base.css') // 抽离独立css样式
];
module.exports = {
  // 入口文件
  entry: {
    index: [
      './fsrc/main.js'
    ]
  },
  // 输出
  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: 'dist',
    library: 'umd',  // 打包成模块(库),可加装
    filename: '[name].js'
  },
  plugins: plugins,
  resolve: {
    // 根目录遍历
    modules: [path.join(__dirname, 'fsrc'), path.join(__dirname, 'node_modules')],
    alias: {
      react: path.join(__dirname, '/node_modules/react/dist/react.min'),
      'react-dom': path.join(__dirname, '/node_modules/react-dom/dist/react-dom.min')
    },
    // 描述文件：这些 JSON 文件将在目录中被读取。
    descriptionFiles: ['package.json'],
    // 自动补全后缀
    extensions: ['.js', '.jsx', '.styl', '.css', '.png', '.jpg'],
    // 如果extensions失败,尝试不补全
    enforceExtension: false
  },
  externals: { electron: 'commonjs electron' },
  module: {
    // 减少依赖的查找
    noParse: [
      /react\.min/
    ],
    rules: [
      {
        test: /\.(js|jsx)$/,
        use: ['babel-loader', 'eslint-loader'],
        exclude: [path.resolve(__dirname, 'node_modules')]
      }, {
        test: /\.(png|jpg|gif)$/,
        use: 'url?limit=8192',
        exclude: [path.resolve(__dirname, 'node_modules')]
      }, {
        test: /\.ttf/,
        use: 'file?prefix=font/',
        exclude: [path.resolve(__dirname, 'node_modules')]
      }, {
        test: /\.(styl)$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [{
            loader: 'css-loader',
            options: {
              modules: true,
              sourceMap: false,
              importLoaders: 1,
              localIdentName: '[name]__[local]___[hash:base64:5]'
            }
          }, {
            loader: 'stylus-loader',
            options: {
              use: [
                poststylus([
                  autoprefixer({ browsers: ['> 1%', 'IE 8'] })
                ])
              ]
            }
          }]
        })
      }
    ]
  }
};