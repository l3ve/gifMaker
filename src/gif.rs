extern crate byteorder;
extern crate crc;

use self::byteorder::{LittleEndian, ReadBytesExt};
use std::fs::File;
use std::io::prelude::*;
use std::io::Cursor;
use std::io::Result;

const EXTENSION: u8 = 0x21;
const APPLICATION_EXTENSION: u8 = 0xff;
const COMMENT_EXTENSION: u8 = 0xfe;
const GRAPHIC_CONTROL_EXTENSION: u8 = 0xf9;
const PLAIN_TEXT_EXTENSION: u8 = 0x01;

const IMAGE_DESCRIPTOR: u8 = 0x2c;
const END: u8 = 0x3b;

#[derive(Debug)]
struct Gif {
    width: u16,
    height: u16,
    table: Vec<u8>,
    global_color_table: Vec<u8>,
    base_image_data: Vec<u8>,
    buffer: Vec<u8>,
}

impl Gif {
    fn new(mut data: Vec<u8>) -> Gif {
        let _header: Vec<u8> = data.drain(..6).collect();
        Gif {
            width: 0,
            height: 0,
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
        println!("{:?}", self);
    }

    fn get_logical_screen_descriptor(&mut self) -> (bool, u8) {
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
        let color_resolution: String = compression_bit.drain(..3).collect();
        let color_resolution = binary_to_decimal(color_resolution) + 1;
        // 颜色列表排序方式
        // 0 – 没有排序过
        // 1 – 递减排序，最重要的颜色优先
        let sort_flag: String = compression_bit.drain(..1).collect();
        let sort_flag = string_to_decimal(&sort_flag);
        // 全局颜色的大小
        let global_color_table_size: String = compression_bit.drain(..3).collect();
        let global_color_table_size =
            2_u8.pow((binary_to_decimal(global_color_table_size) + 1) as u32);
        // 背景颜色在全局颜色里的索引
        let background_color_index: Vec<u8> = data.drain(..1).collect();
        // 宽高比
        let aspect_ratio: Vec<u8> = data.drain(..1).collect();
        let aspect_ratio: bool = number_to_bool(aspect_ratio[0]);
        self.width = width;
        self.height = height;
        return (global_color_table_flag, global_color_table_size);
    }
    fn get_global_color_table(&mut self, size: u8) {
        let _size = (size * 3) as usize;
        let global_color_table: Vec<u8> = self.buffer.drain(.._size).collect();
        self.global_color_table = global_color_table;
        // lzw_encode(_global_color_table);
        // println!("全局颜色列表:{:?}", _global_color_table);
    }
    fn get_local_color_table(&mut self, size: u8) {
        let _size = (size * 3) as usize;
        let _local_color_table: Vec<u8> = self.buffer.drain(.._size).collect();
        // println!("局部颜色列表:{:?}", _local_color_table);
    }
    fn get_based_image_data(&mut self) {
        let lzw_minimum_color_size: Vec<u8> = self.buffer.drain(..1).collect();
        let len: Vec<u8> = self.buffer.drain(..1).collect();
        let data: Vec<u8> = self.buffer.drain(..(len[0] as usize)).collect();
        // lzw_encode(data);
        self.base_image_data = data;
        // println!("{:?}---{:?}", len, data);
    }
    fn chuck_data(&mut self) {
        while self.buffer.len() > 0 {
            let sign: Vec<u8> = self.buffer.drain(..1).collect();
            match sign[0] {
                EXTENSION => self.chuck_extension(),
                IMAGE_DESCRIPTOR => self.chuck_id(),
                END => println!("this is the end~"),
                _ => self.empty(),
            }
        }
    }
    fn chuck_extension(&mut self) {
        let sign: Vec<u8> = self.buffer.drain(..1).collect();
        match sign[0] {
            APPLICATION_EXTENSION => self.chuck_ae(),
            GRAPHIC_CONTROL_EXTENSION => self.chuck_gce(),
            COMMENT_EXTENSION => self.empty(),
            PLAIN_TEXT_EXTENSION => self.empty(),
            _ => self.empty(),
        }
    }
    fn empty(&mut self) {}
    fn chuck_ae(&mut self) {
        let length: Vec<u8> = self.buffer.drain(..1).collect();
        let ce_data: Vec<u8> = self.buffer.drain(..(length[0] as usize)).collect();
        // println!("application_extension:{:?}", ce_data);
    }
    fn chuck_gce(&mut self) {
        let length: Vec<u8> = self.buffer.drain(..1).collect();
        let mut gce_data: Vec<u8> = self.buffer.drain(..(length[0] as usize)).collect();
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
        let disposal_method: String = compression_bit.drain(..3).collect();
        let disposal_method = binary_to_decimal(disposal_method);
        let _user_input_flag: String = compression_bit.drain(..1).collect();
        let transparent_color_flag: String = compression_bit.drain(..1).collect();
        let transparent_color_flag: bool =
            number_to_bool(string_to_decimal(&transparent_color_flag));
        // 延迟时长
        let delay_time = buffer_to_decimal(&gce_data.drain(..2).collect());
        // 透明色索引
        let mut transparent_color_index = 0;
        if (transparent_color_flag) {
            transparent_color_index = gce_data[0];
        }
    }
    fn chuck_id(&mut self) {
        let mut data: Vec<u8> = self.buffer.drain(..9).collect();
        let left = buffer_to_decimal(&data.drain(..2).collect());
        let top = buffer_to_decimal(&data.drain(..2).collect());
        let width = buffer_to_decimal(&data.drain(..2).collect());
        let height = buffer_to_decimal(&data.drain(..2).collect());
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
            2_u8.pow((string_to_decimal(&_local_color_table_size) + 1) as u32);

        if number_to_bool(string_to_decimal(&_local_color_table_flag)) {
            self.get_local_color_table(_local_color_table_size);
        }
        self.get_based_image_data();
    }
}

pub fn new(url: &str) {
    let data_buffer: Vec<u8> = get_image_buffer(url).unwrap();
    let mut gif = Gif::new(data_buffer);
    gif.analysis();
}

// 工具类
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

fn number_to_bool(num: u8) -> bool {
    let mut _res = true;
    if num == 0 {
        _res = false
    }
    return _res;
}

fn pad_start(str: String) -> String {
    let after_pad_start = u64::from_str_radix(&str, 10).unwrap();
    return format!("{:08}", after_pad_start);
}

fn lzw_encode(_data: Vec<u8>) {
    let data = _data.clone();
    println!("{:?}", data);
}
