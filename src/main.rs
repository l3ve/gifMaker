// mod gif;
mod png;

fn main() {
  // let _png = png::Img::new("./images/1.png");
  // let color = png::Img::get_color_data(&_png);
  // let color = spread(color);
  // println!("{:?}", color);
  println!("{}", decimal_to_binary(10))
}


// 转换 十进制 为 二进制
fn decimal_to_binary(target: u8) -> u8 {
  return u8::from_str_radix(&format!("{:b}", target), 2).unwrap();
}


// fn spread( mut v:Vec<Vec<u8>>)->Vec<u8> {
//   let mut _v = vec![];
//   for ele in v.iter_mut() {
//     ele.pop();
//     _v.append(ele)
//   }
//   return _v
// }