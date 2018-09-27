module.exports = {

  PNG_SIGNATURE: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],

  TYPE_IHDR: [0x49, 0x48, 0x44, 0x52],
  TYPE_IEND: [0x49, 0x45, 0x4e, 0x44],
  TYPE_pHYs: [0X70, 0X48, 0X59, 0X73],
  TYPE_IDAT: [0x49, 0x44, 0x41, 0x54],
  TYPE_PLTE: [0x50, 0x4c, 0x54, 0x45],
  TYPE_tRNS: [0x74, 0x52, 0x4e, 0x53],
  TYPE_gAMA: [0x67, 0x41, 0x4d, 0x41],
  TYPE_sRGB: [0X73, 0X52, 0X47, 0X42],

  // 色道类型
  COLORTYPE_GRAYSCALE: 0,
  COLORTYPE_PALETTE: 1,
  COLORTYPE_COLOR: 2,
  COLORTYPE_ALPHA: 4, // 灰度透明

  COLORTYPE_TO_BPP_MAP: {
    0: 1,  // 灰度图像
    2: 3,  // 彩色图像
    3: 1,  // 索引彩色图像
    4: 2,  // 带alpha灰度图像
    6: 4   // 带alpha彩色图像
  },

  GAMMA_DIVISION: 100000
};