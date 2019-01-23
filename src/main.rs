mod gif;
fn main() {
  gif::new("./images/gif.gif")
}

// #[cfg(test)]
// #[test]
// fn round_trip() {
//   use lzw::{Decoder, Encoder, LsbReader, LsbWriter};
//   let size = 8;
//   let data = b"TOBEORNOTTOBEORTOBEORNOT";
//   let mut compressed = vec![];
//   {
//     let mut enc = Encoder::new(LsbWriter::new(&mut compressed), size).unwrap();
//     enc.encode_bytes(data).unwrap();
//   }
//   println!("{:?}", compressed);
//   let mut dec = Decoder::new(LsbReader::new(), size);
//   let mut compressed = &compressed[..];
//   let mut data2 = vec![];
//   while compressed.len() > 0 {
//     let (start, bytes) = dec.decode_bytes(&compressed).unwrap();
//     compressed = &compressed[start..];
//     data2.extend(bytes.iter().map(|&i| i));
//   }
//   assert_eq!(data2, data)
// }
