extern crate byteorder;
extern crate crc;
extern crate flate2;

use std::fs::File;
use std::io::Cursor;
use std::io::Result;
use std::io::prelude::*;
use std::collections::HashMap;
use self::byteorder::{BigEndian, ReadBytesExt};
use self::crc::crc32;
use self::flate2::Compression;
use self::flate2::write::{ZlibDecoder, ZlibEncoder};

const PNG_SIGNATURE: [u8; 8] = [137, 80, 78, 71, 13, 10, 26, 10];
const NECESSARY_CHUCKS_NAME: [&str; 4] = ["IHDR", "PLTE", "IDAT", "IEND"];
const IHDR: [u8; 4] = [73, 72, 68, 82];
// const PLTE: [u8; 4] = [80, 76, 84, 69];
const IDAT: [u8; 4] = [73, 68, 65, 84];
const IEND: [u8; 4] = [73, 69, 78, 68];

#[derive(Debug)]
pub struct Img<'i> {
  chucks: HashMap<String, Vec<HashMap<&'i str, Vec<u8>>>>,
  meta_data: HashMap<&'i str, u32>,
}

impl<'i> Img<'i> {
  pub fn new(url: &str) -> Img {
    let mut data_buffer: Vec<u8> = Img::get_image_buffer(url).unwrap();
    // 去除 PNG_SIGNATURE
    data_buffer.drain(..8);
    let chucks = Img::chuck_data(&mut data_buffer);
    let meta_data = Img::get_meta_data(chucks.get("IHDR").unwrap()[0].get("chuck").unwrap());
    return Img { chucks, meta_data };
  }
  #[allow(dead_code)]
  pub fn create_png(url: &str, meta: &mut Vec<u8>, color: &mut Vec<u8>) -> Result<File> {
    let mut file = File::create(url)?;
    let mut buffer: Vec<u8> = Vec::new();
    buffer.append(&mut PNG_SIGNATURE.to_vec());
    // IHDR chuck
    buffer.append(&mut vec![0, 0, 0, 13]);
    buffer.append(&mut IHDR.to_vec());
    buffer.append(&mut meta.clone());
    let mut ihdr_crc_data = IHDR.to_vec();
    ihdr_crc_data.append(meta);
    buffer.append(&mut Img::crc(&ihdr_crc_data));
    // IDAT chuck
    buffer.append(&mut vec![0, 0, 0, 30]);
    buffer.append(&mut IDAT.to_vec());
    let mut zlib_color_data = Img::zlib_encoder(color).unwrap();
    buffer.append(&mut zlib_color_data);
    let mut idat_crc_data = IDAT.to_vec();
    idat_crc_data.append(&mut zlib_color_data);
    buffer.append(&mut Img::crc(&idat_crc_data));
    // IEND chuck
    buffer.append(&mut vec![0, 0, 0, 0]);
    buffer.append(&mut IEND.to_vec());
    buffer.append(&mut Img::crc(&IEND.to_vec()));
    file.write(&buffer)?;
    return Ok(file);
  }
  #[allow(dead_code)]
  pub fn _zip_png(url: &str, img: &mut Img) -> Result<File> {
    let mut file = File::create(url)?;
    let mut buffer: Vec<u8> = Vec::new();
    buffer.append(&mut PNG_SIGNATURE.to_vec());
    for &key in NECESSARY_CHUCKS_NAME.iter() {
      let _be: bool = img.chucks.contains_key(key);
      if _be {
        for item in img.chucks.get(key).unwrap().iter() {
          buffer.append(&mut item.get("length").unwrap().to_vec());
          buffer.append(&mut item.get("signature").unwrap().to_vec());
          buffer.append(&mut item.get("chuck").unwrap().to_vec());
          buffer.append(&mut item.get("crc").unwrap().to_vec());
        }
      }
    }
    file.write(&buffer)?;
    return Ok(file);
  }
  #[allow(dead_code)]
  fn get_image_buffer(url: &str) -> Result<Vec<u8>> {
    let mut f = File::open(url)?;
    let mut buffer = Vec::new();
    f.read_to_end(&mut buffer)?;
    return Ok(buffer);
  }
  #[allow(dead_code)]
  pub fn get_color_data(img: &Img) -> Vec<Vec<u8>> {
    let mut data =
      Img::zlib_decoder(img.chucks.get("IDAT").unwrap()[0].get("chuck").unwrap()).unwrap();
    return Img::filtering(&mut data, img);
  }
  #[allow(dead_code)]
  fn get_meta_data<'d>(ihdr: &Vec<u8>) -> HashMap<&'d str, u32> {
    let mut data_buffer = ihdr.clone();
    let mut meta_data = HashMap::new();
    let width_length = Img::transform_to_decimal(&data_buffer.drain(..4).collect());
    let height_length = Img::transform_to_decimal(&data_buffer.drain(..4).collect());
    let depth: &Vec<u8> = &data_buffer.drain(..1).collect();
    let color_type: Vec<u8> = data_buffer.drain(..1).collect();
    let bpp = Img::get_bpp(color_type[0]);
    meta_data.insert("width", width_length);
    meta_data.insert("height", height_length);
    meta_data.insert("depth", depth[0] as u32);
    meta_data.insert("color_type", color_type[0] as u32);
    meta_data.insert("bpp", bpp);
    return meta_data;
  }
  #[allow(dead_code)]
  fn get_bpp(ctype: u8) -> u32 {
    let bpp: u32 = match ctype {
      0 | 3 => 1, // 0：灰度图像  3：索引彩色图像
      2 => 3,     // 彩色图像
      4 => 2,     // 带alpha灰度图像
      6 => 4,     // 带alpha彩色图像
      _ => 3,
    };
    return bpp;
  }
  #[allow(dead_code)]
  fn get_xcomparison(img: &Img) -> u32 {
    let bpp = *img.meta_data.get("bpp").unwrap();
    let depth = *img.meta_data.get("depth").unwrap();
    let xcomparison: u32 = match depth {
      8u32 => bpp,
      16u32 => (bpp * 2),
      _ => bpp,
    };
    return xcomparison;
  }
  #[allow(dead_code)]
  fn crc(content: &Vec<u8>) -> Vec<u8> {
    let mut _crc = crc32::checksum_ieee(content);
    return Img::transform_to_vecu8(_crc);
  }
  #[allow(dead_code)]
  fn filtering(data: &mut Vec<u8>, img: &Img) -> Vec<Vec<u8>> {
    let x_comparison = Img::get_xcomparison(img);
    let byte_width = Img::get_byte_width(img);
    let line_width = (byte_width + 1) as usize;
    let loop_times = (data.len() / line_width) as usize;
    let mut index = 0usize;
    let mut color_data: Vec<Vec<u8>> = Vec::new();
    while index < loop_times {
      let mut _data: Vec<u8> = data.drain(..line_width).collect();
      _data = match _data[0] {
        1u8 => Img::filter_type1(_data, x_comparison),
        2u8 => Img::filter_type2(_data, &color_data[index - 1]),
        3u8 => Img::filter_type3(_data, x_comparison, &color_data[index - 1]),
        4u8 => Img::filter_type4(_data, x_comparison, &color_data[index - 1]),
        _ => _data,
      };
      color_data.push(_data);
      index = index + 1;
    }
    return color_data;
  }
  #[allow(dead_code)]
  fn filter_type1(data: Vec<u8>, x_comparison: u32) -> Vec<u8> {
    let mut _data = data.clone();
    let mut _len = _data.len() as usize;
    let mut index = 0usize;
    while index < _len - 1 {
      let orig_a;
      if index > (x_comparison - 1) as usize {
        orig_a = _data[index - x_comparison as usize];
      } else {
        orig_a = 0;
      }
      _data[index] = _data[index + 1] + orig_a;
      index = index + 1;
    }
    return _data;
  }
  #[allow(dead_code)]
  fn filter_type2(data: Vec<u8>, upline_data: &Vec<u8>) -> Vec<u8> {
    let mut _data = data.clone();
    let mut _len = _data.len() as usize;
    let mut index = 0usize;
    while index < _len - 1 {
      let orig_b = upline_data[index];
      _data[index] = _data[index + 1] + orig_b;
      index = index + 1;
    }
    return _data;
  }
  #[allow(dead_code)]
  fn filter_type3(data: Vec<u8>, x_comparison: u32, upline_data: &Vec<u8>) -> Vec<u8> {
    let mut _data = data.clone();
    let mut _len = _data.len() as usize;
    let mut index = 0usize;
    while index < _len - 1 {
      let orig_b = upline_data[index as usize];
      let orig_a;
      if index > (x_comparison - 1) as usize {
        orig_a = _data[index - x_comparison as usize];
      } else {
        orig_a = 0;
      }
      _data[index] = _data[index + 1] + (orig_a + orig_b) / 2;
      index = index + 1;
    }
    return _data;
  }
  #[allow(dead_code)]
  fn filter_type4(data: Vec<u8>, x_comparison: u32, upline_data: &Vec<u8>) -> Vec<u8> {
    let mut _data = data.clone();
    let mut _len = _data.len() as usize;
    let mut index = 0usize;
    while index < _len - 1 {
      let orig_a;
      let orig_b = upline_data[index as usize];
      let orig_c = upline_data[index - 1];
      if index > (x_comparison - 1) as usize {
        orig_a = _data[index - x_comparison as usize];
      } else {
        orig_a = 0;
      }
      let p = orig_a + orig_b - orig_c;
      let pa = (p - orig_a) as isize;
      let pa = pa.abs();
      let pb = (p - orig_b) as isize;
      let pb = pb.abs();
      let pc = (p - orig_c) as isize;
      let pc = pc.abs();
      if pa <= pb && pa <= pc {
        _data[index] = _data[index + 1] + orig_a;
      } else if pb <= pc {
        _data[index] = _data[index + 1] + orig_b;
      } else {
        _data[index] = _data[index + 1] + orig_c;
      }
      index = index + 1;
    }
    return _data;
  }
    #[allow(dead_code)]
  fn zlib_decoder(data: &Vec<u8>) -> Result<Vec<u8>> {
    let mut e = ZlibDecoder::new(Vec::new());
    e.write(data)?;
    let decoder_bytes = e.finish()?;
    return Ok(decoder_bytes);
  }
  #[allow(dead_code)]
  fn zlib_encoder(data: &Vec<u8>) -> Result<Vec<u8>> {
    let mut e = ZlibEncoder::new(Vec::new(), Compression::default());
    e.write(&data)?;
    let encoder_bytes = e.finish()?;
    return Ok(encoder_bytes);
  }
  #[allow(dead_code)]
  fn get_byte_width(img: &Img) -> u32 {
    let width = *img.meta_data.get("width").unwrap() as f32;
    let bpp = *img.meta_data.get("bpp").unwrap() as f32;
    let depth = *img.meta_data.get("depth").unwrap() as f32;
    let mut byte_width = width * bpp;
    if depth != 8f32 {
      byte_width = (byte_width / (8f32 / depth)).ceil();
    }
    return byte_width as u32;
  }
  // 转换 buffer 为十进制
  #[allow(dead_code)]
  fn transform_to_decimal(buffer: &Vec<u8>) -> u32 {
    return Cursor::new(buffer).read_u32::<BigEndian>().unwrap();
  }
  // 转换 integer 为 Vec<u8>
  #[allow(dead_code)]
  fn transform_to_vecu8(mut integer: u32) -> Vec<u8> {
    let mut vec = Vec::new();
    while integer > 255 {
      vec.insert(0, (integer % 256) as u8);
      integer = integer / 256;
    }
    vec.insert(0, integer as u8);
    return vec;
  }
  fn chuck_data<'s>(data_buffer: &mut Vec<u8>) -> HashMap<String, Vec<HashMap<&'s str, Vec<u8>>>> {
    let mut buffer = HashMap::new();
    // 获取各个 chuck 块
    while data_buffer.len() > 0 {
      let mut chuck = HashMap::new();
      // chuck 的结构为： length + signature + data + crc
      let mut _data_len = Vec::new();
      let mut _signature = Vec::new();
      let mut _chuck_data = Vec::new();
      let mut _crc = Vec::new();
      // 截取
      _data_len = data_buffer.drain(..4).collect();
      _signature = data_buffer.drain(..4).collect();

      let length = Img::transform_to_decimal(&_data_len);

      _chuck_data = data_buffer.drain(..length as usize).collect();
      _crc = data_buffer.drain(..4).collect();

      chuck.insert("signature", _signature.clone());
      chuck.insert("length", _data_len);
      chuck.insert("chuck", _chuck_data);
      chuck.insert("crc", _crc);

      // 某些 chuck 会重复出现，例如：IDAT
      let str_signature = String::from_utf8(_signature).unwrap();
      let some_u8_value = buffer.get(&str_signature).cloned();
      match some_u8_value {
        Some(_i) => {
          let _v: &mut Vec<HashMap<&str, Vec<u8>>> = buffer.get_mut(&str_signature).unwrap();
          _v.push(chuck);
        }
        None => {
          buffer.insert(str_signature, vec![chuck]);
        }
      }
    }
    return buffer;
  }
}
