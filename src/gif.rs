extern crate crc;

use byteorder::{LittleEndian, ReadBytesExt};
use lzw::{Decoder, Encoder, LsbReader, LsbWriter};
use std::fs::File;
use std::io::prelude::*;
use std::io::Cursor;
use std::io::Result;

const HEADER: &'static [u8; 6] = b"GIF89a";

const EXTENSION: u8 = 0x21;
const APPLICATION_EXTENSION: u8 = 0xff;
const COMMENT_EXTENSION: u8 = 0xfe;
const GRAPHIC_CONTROL_EXTENSION: u8 = 0xf9;
const PLAIN_TEXT_EXTENSION: u8 = 0x01;

const IMAGE_DESCRIPTOR: u8 = 0x2c;
const END: u8 = 0x3b;

#[derive(Debug)]
struct Gif {
    header: Vec<u8>,
    width: u16,
    height: u16,
    table: Vec<u8>,
    data_source: Vec<u8>,
    global_color_table: Vec<u8>,
    base_image_data: Vec<Vec<u8>>,
    buffer: Vec<u8>,
}

impl Gif {
    fn new(mut data: Vec<u8>) -> Gif {
        let _header: Vec<u8> = data.drain(..6).collect();
        Gif {
            header: _header,
            width: 0,
            height: 0,
            data_source: data.clone(),
            table: vec![],
            global_color_table: vec![],
            base_image_data: vec![],
            buffer: data,
        }
    }
    fn analysis(&mut self) {
        let (flag, size) = self.get_logical_screen_descriptor();
        if flag {
            self.get_global_color_table(size);
        }
        self.chuck_data();
    }

    fn get_logical_screen_descriptor(&mut self) -> (bool, usize) {
        println!("logical screen descriptor");
        let mut data: Vec<u8> = self.buffer.drain(..7).collect();
        // 高宽
        let width = buffer_to_decimal(&data.drain(..2).collect());
        let height = buffer_to_decimal(&data.drain(..2).collect());
        let compression_bit: Vec<u8> = data.drain(..1).collect();
        let mut compression_bit = decimal_to_binary(compression_bit[0]);
        // 是否存在全局颜色
        let global_color_table_flag: String = compression_bit.drain(..1).collect();
        let global_color_table_flag = string_to_decimal(&global_color_table_flag);
        let global_color_table_flag: bool = number_to_bool(global_color_table_flag);
        // 颜色的位数
        let _color_resolution: String = compression_bit.drain(..3).collect();
        let _color_resolution = binary_to_decimal(_color_resolution) + 1;
        // 颜色列表排序方式
        // 0 – 没有排序过
        // 1 – 递减排序，最重要的颜色优先
        let _sort_flag: String = compression_bit.drain(..1).collect();
        let _sort_flag = string_to_decimal(&_sort_flag);
        // 全局颜色的大小
        let global_color_table_size: String = compression_bit.drain(..3).collect();
        let global_color_table_size =
            2_usize.pow((binary_to_decimal(global_color_table_size) + 1) as u32);
        // 背景颜色在全局颜色里的索引
        let _background_color_index: Vec<u8> = data.drain(..1).collect();
        // 宽高比
        let _aspect_ratio: Vec<u8> = data.drain(..1).collect();
        let _aspect_ratio: bool = number_to_bool(_aspect_ratio[0]);
        self.width = width;
        self.height = height;
        return (global_color_table_flag, global_color_table_size);
    }
    fn get_global_color_table(&mut self, size: usize) {
        println!("global color table");
        let _size = (size * 3) as usize;
        let global_color_table: Vec<u8> = self.buffer.drain(.._size).collect();
        self.global_color_table = global_color_table;
    }
    fn get_local_color_table(&mut self, size: usize) {
        println!("local color table");
        let _size = (size * 3) as usize;
        let _local_color_table: Vec<u8> = self.buffer.drain(.._size).collect();
    }
    fn get_based_image_data(&mut self) {
        let _lzw_minimum_color_size: Vec<u8> = self.buffer.drain(..1).collect();
        let mut len: Vec<u8> = self.buffer.drain(..1).collect();
        let mut base_image_data_index = vec![];
        while len[0] != 0 {
            // println!("{:?}", len);
            // if (self.buffer.len() < 700) {
            //     println!("{:?}", self.buffer);
            //     println!("buffer-len:{:?}", self.buffer.len());
            // }
            let mut data: Vec<u8> = self.buffer.drain(..(len[0] as usize)).collect();
            base_image_data_index.append(&mut data);
            len = self.buffer.drain(..1).collect();
        }
        base_image_data_index = lzw_decode(&base_image_data_index, _lzw_minimum_color_size[0]);
        println!("lzw end");
        self.base_image_data.push(base_image_data_index);
    }
    fn chuck_data(&mut self) {
        while self.buffer.len() > 0 {
            let sign: Vec<u8> = self.buffer.drain(..1).collect();
            match sign[0] {
                EXTENSION => self.chuck_extension(),
                IMAGE_DESCRIPTOR => self.chuck_id(),
                END => println!("This is the end~"),
                _ => self.no_match(sign[0]),
            }
        }
    }
    fn chuck_extension(&mut self) {
        let sign: Vec<u8> = self.buffer.drain(..1).collect();
        match sign[0] {
            APPLICATION_EXTENSION => self.chuck_ae(),
            GRAPHIC_CONTROL_EXTENSION => self.chuck_gce(),
            COMMENT_EXTENSION => self.chuck_ce(),
            PLAIN_TEXT_EXTENSION => self.chuck_pte(),
            _ => self.no_match(sign[0]),
        }
    }
    fn no_match(&mut self, no_match: u8) {
        println!("no_match_sign:{:?}", no_match);
    }
    fn chuck_ae(&mut self) {
        println!("Application Extension");
        let mut length: Vec<u8> = self.buffer.drain(..1).collect();
        let _ae_netscape: Vec<u8> = self.buffer.drain(..(length[0] as usize)).collect();
        length = self.buffer.drain(..1).collect();
        let _ae_data: Vec<u8> = self.buffer.drain(..(length[0] as usize)).collect();
        let _block_terminator: Vec<u8> = self.buffer.drain(..1).collect();
    }
    fn chuck_ce(&mut self) {
        println!("Comment Extension");
        let length: Vec<u8> = self.buffer.drain(..1).collect();
        let _ce_data: Vec<u8> = self.buffer.drain(..(length[0] as usize)).collect();
        let _block_terminator: Vec<u8> = self.buffer.drain(..1).collect();
    }
    fn chuck_pte(&mut self) {
        println!("Plain Text Extension");
        let mut length: Vec<u8> = self.buffer.drain(..1).collect();
        let _pte: Vec<u8> = self.buffer.drain(..(length[0] as usize)).collect();
        length = self.buffer.drain(..1).collect();
        let _pt_data: Vec<u8> = self.buffer.drain(..(length[0] as usize)).collect();
        let _block_terminator: Vec<u8> = self.buffer.drain(..1).collect();
    }
    fn chuck_gce(&mut self) {
        println!("Graphic Control Extension");
        let length: Vec<u8> = self.buffer.drain(..1).collect();
        let mut gce_data: Vec<u8> = self.buffer.drain(..(length[0] as usize)).collect();
        let _block_terminator: Vec<u8> = self.buffer.drain(..1).collect();
        let compression_bit: Vec<u8> = gce_data.drain(..1).collect();
        let compression_bit: String = decimal_to_binary(compression_bit[0]);
        let mut compression_bit: String = pad_start(compression_bit);
        // 前三位 bit 保留,前置3位，转换是去掉了
        let _reserved: String = compression_bit.drain(..3).collect();
        // disposal_method_values :
        // 0 – 未指定，解码器不需要做任何动作，这个选项可以将一个全尺寸，非透明框架替换为另一个。
        // 1 – 不要处置，在此选项中，未被下一帧覆盖的任何像素继续显示。
        // 2 – 还原为背景图像，被图像使用的区域必须还原为背景颜色。
        // 3 – 还原为上一个，解码器必须还原被图像覆盖的区域为之前渲染的图像。
        // 4-7 – 未定义。
        let _disposal_method: String = compression_bit.drain(..3).collect();
        let _disposal_method = binary_to_decimal(_disposal_method);
        let _user_input_flag: String = compression_bit.drain(..1).collect();
        let transparent_color_flag: String = compression_bit.drain(..1).collect();
        let transparent_color_flag: bool =
            number_to_bool(string_to_decimal(&transparent_color_flag));
        // 延迟时长
        let _delay_time = buffer_to_decimal(&gce_data.drain(..2).collect());
        // 透明色索引
        let mut _transparent_color_index = 0;
        if transparent_color_flag {
            _transparent_color_index = gce_data[0];
        }
    }
    fn chuck_id(&mut self) {
        println!("Image Descriptor");
        let mut data: Vec<u8> = self.buffer.drain(..9).collect();
        let _left = buffer_to_decimal(&data.drain(..2).collect());
        let _top = buffer_to_decimal(&data.drain(..2).collect());
        let _width = buffer_to_decimal(&data.drain(..2).collect());
        let _height = buffer_to_decimal(&data.drain(..2).collect());
        let compression_bit: Vec<u8> = data.drain(..1).collect();
        let compression_bit: String = decimal_to_binary(compression_bit[0]);
        let mut compression_bit: String = pad_start(compression_bit);
        // 是否有局部颜色列表
        // 0 – 没有 Local Color Table，如果 Global Color Table存在的话使用 Global Color Table
        // 1 – 有 Local Color Table，紧紧跟随在 Image Descriptor后面
        let _local_color_table_flag: String = compression_bit.drain(..1).collect();
        // _interlace
        // 0 – 图像没有隔行扫描
        // 1 – 图像隔行扫描
        let _interlace: String = compression_bit.drain(..1).collect();
        // _sort_flag
        // 0 – 没有排序
        // 1 – 按照重要次序递减排序
        let _sort_flag: String = compression_bit.drain(..1).collect();
        // 预留数据
        let _reserved: String = compression_bit.drain(..2).collect();
        // 局部颜色列表大小
        let _local_color_table_size: String = compression_bit.drain(..3).collect();
        let _local_color_table_size =
            2_usize.pow((binary_to_decimal(_local_color_table_size) + 1) as u32);
        if number_to_bool(string_to_decimal(&_local_color_table_flag)) {
            self.get_local_color_table(_local_color_table_size);
        }
        self.get_based_image_data();
    }
}

pub fn new(url: &str) {
    let data_buffer: Vec<u8> = get_image_buffer(url).unwrap();
    println!("{:?}", data_buffer);
    let mut gif = Gif::new(data_buffer);
    gif.analysis();
    let _aaa = create_gif(10, 10);
}

// 工具类
// 写 gif 图
fn create_gif(w: u16, h: u16) -> Result<()> {
    let mut f = File::create("l3ve.gif")?;
    let mut data = HEADER.to_vec();
    let mut logical_screen_descriptor = build_logical_screen_descriptor(w, h);
    // let mut global_image_data = build_global_image_data();
    let mut graphic_control_extension = build_graphic_control_extension(64);
    let mut image_descriptor = build_image_descriptor(w, h);
    let mut based_image_data = build_based_image_data(
        4,
        vec![
            16, 128, 71, 43, 5, 73, 218, 155, 186, 174, 88, 231, 77, 79, 40, 142, 230, 41, 165, 25,
            105, 126, 28, 12, 146, 219, 19, 1,
        ],
    );
    let mut based_image_data_2 =
        build_based_image_data(4, vec![240, 201, 73, 171, 189, 56, 235, 205, 123, 142]);
    data.append(&mut logical_screen_descriptor);
    // data.append(&mut global_image_data);
    data.append(&mut graphic_control_extension.clone());
    data.append(&mut image_descriptor.clone());
    data.append(&mut based_image_data);
    data.append(&mut graphic_control_extension);
    data.append(&mut image_descriptor);
    data.append(&mut based_image_data_2);
    data.append(&mut vec![59]);
    println!("{:?}", data);
    f.write_all(&data)?;
    f.sync_all()?;
    Ok(())
}
fn build_logical_screen_descriptor(w: u16, h: u16) -> Vec<u8> {
    let mut logical_screen_descriptor = vec![];
    let mut _w = decimal_to_u16_buffer(w);
    let mut _h = decimal_to_u16_buffer(h);
    logical_screen_descriptor.append(&mut _w);
    logical_screen_descriptor.append(&mut _h);
    // 1.Global Color Table Flag              0 or 1
    // 2.Color Resolution                     3 bits  rgba 8位
    // 3.Sort Flag                            0 or 1
    // 4.Size of Global Color Table           3 bits
    logical_screen_descriptor.append(&mut vec![binary_to_decimal(String::from("01110000"))]);
    logical_screen_descriptor.append(&mut vec![0]);
    logical_screen_descriptor.append(&mut vec![0]);
    return logical_screen_descriptor;
}
fn build_graphic_control_extension(delay_time: u16) -> Vec<u8> {
    let mut graphic_control_extension = vec![0x21, 0xf9, 0x4];
    // 0.Reserved                    保留
    // 1.Disposal Method             3 bits
    //                    0 -   No disposal specified. The decoder is
    //                          not required to take any action.
    //                    1 -   Do not dispose. The graphic is to be left
    //                          in place.
    //                    2 -   Restore to background color. The area used by the
    //                          graphic must be restored to the background color.
    //                    3 -   Restore to previous. The decoder is required to
    //                          restore the area overwritten by the graphic with
    //                          what was there prior to rendering the graphic.
    //                    4-7 - To be defined.
    // 2.User Input Flag             0 or 1
    // 3.Transparency Flag           0 or 1
    graphic_control_extension.append(&mut vec![binary_to_decimal(String::from("00000100"))]);
    let mut _delay_time = decimal_to_u16_buffer(delay_time);
    graphic_control_extension.append(&mut _delay_time);
    graphic_control_extension.append(&mut vec![0x00]);
    // 终结符
    graphic_control_extension.append(&mut vec![0]);
    return graphic_control_extension;
}
fn build_image_descriptor(w: u16, h: u16, l: u8) -> Vec<u8> {
    let mut image_descriptor = vec![0x2c];
    // left top
    image_descriptor.append(&mut vec![0, 0, 0, 0]);
    let mut _w = decimal_to_u16_buffer(w);
    let mut _h = decimal_to_u16_buffer(h);
    image_descriptor.append(&mut _w);
    image_descriptor.append(&mut _h);
    // 1.Local Color Table Flag            0 or 1
    // 2.Interlace Flag                    0 or 1
    // 3.Sort Flag                         0 or 1
    // 4.Reserved                          2 bits
    // 5.Size of Local Color Table         3 bits
    let mut packed_fields = String::from("10000");
    packed_fields.push_str("111");
    image_descriptor.append(&mut vec![binary_to_decimal(packed_fields)]);
    return image_descriptor;
}
fn build_based_image_data(lzw: u8, mut data: Vec<u8>) -> Vec<u8> {
    let mut based_image_data = vec![lzw];
    based_image_data.append(&mut vec![data.len() as u8]);
    based_image_data.append(&mut data);
    based_image_data.append(&mut vec![0]);
    return based_image_data;
}
fn build_global_image_data() -> Vec<u8> {
    let global_image_data: Vec<u8> = vec![
        0, 0, 0, 128, 0, 0, 0, 128, 0, 128, 128, 0, 0, 0, 128, 128, 0, 128, 0, 128, 128, 192, 192,
        192, 128, 128, 128, 255, 0, 0, 0, 255, 0, 255, 255, 0, 0, 0, 255, 255, 0, 255, 0, 255, 255,
        255, 255, 255,
    ];
    return global_image_data;
}
// 读取文件流
fn get_image_buffer(url: &str) -> Result<Vec<u8>> {
    let mut f = File::open(url)?;
    let mut buffer = Vec::new();
    f.read_to_end(&mut buffer)?;
    return Ok(buffer);
}
// 转换 buffer 为十进制
fn buffer_to_decimal(buffer: &Vec<u8>) -> u16 {
    return Cursor::new(buffer).read_u16::<LittleEndian>().unwrap();
}

// 转换 十进制 为 二进制
fn decimal_to_binary(target: u8) -> String {
    return format!("{:b}", target);
}

// 转换 十进制 为 u16 buffer
fn decimal_to_u16_buffer(target: u16) -> Vec<u8> {
    let _target = format!("{:b}", target);
    let _target = u64::from_str_radix(&_target, 10).unwrap();
    let after_pad_start = format!("{:016}", _target);
    let (be, le) = after_pad_start.split_at(8);
    return vec![
        binary_to_decimal(le.to_string()),
        binary_to_decimal(be.to_string()),
    ];
}
// 转换 二进制 为 十进制
fn binary_to_decimal(target: String) -> u8 {
    let len = target.len();
    let mut decimal = string_to_decimal(target.get(len - 1..).unwrap());
    for i in 1..len {
        let cur_value = string_to_decimal(target.get(i - 1..i).unwrap());
        if cur_value == 1 {
            decimal += 2_u8.pow((len - i) as u32);
        }
    }
    return decimal;
}

// 转换 字符串 为 十进制
fn string_to_decimal(target: &str) -> u8 {
    return u8::from_str_radix(target, 10).unwrap();
}
// 0 / 1 转布尔值
fn number_to_bool(num: u8) -> bool {
    let mut _res = true;
    if num == 0 {
        _res = false
    }
    return _res;
}
// 二进制补全 8 位
fn pad_start(str: String) -> String {
    let after_pad_start = u64::from_str_radix(&str, 10).unwrap();
    return format!("{:08}", after_pad_start);
}

fn lzw_decode(_data: &Vec<u8>, size: u8) -> Vec<u8> {
    let mut data = _data.clone();
    let mut decoder = Decoder::new(LsbReader::new(), size);
    let mut res = vec![];
    while data.len() > 0 {
        let (start, bytes) = decoder.decode_bytes(&data).unwrap();
        data = data[start..].to_vec();
        res.extend(bytes.iter().map(|&i| i));
    }
    return res;
}

fn lzw_encode(_data: &Vec<u8>, size: u8) -> Vec<u8> {
    let data = _data.clone();
    let mut res = vec![];
    {
        let mut enc = Encoder::new(LsbWriter::new(&mut res), size).unwrap();
        enc.encode_bytes(&data).unwrap();
    }
    println!("{:?}", res);
    return res;
}
