function LZW(s, f) {
  if (!s) return '';
  let dict = {};
  let out = [];
  let prefix = s.charAt(0);
  let curChar = prefix;
  let oldPrefix = curChar;
  let idx = 256;
  let i; let c; let d;
  let g = () => {
    out.push(prefix.length > 1 ? String.fromCharCode(dict[prefix]) : prefix);
  };
  if (f) {
    out.push(prefix);
  }
  for (i = 1, c, d; i < s.length; i += 1) {
    c = s.charAt(i);
    if (f) {
      d = s.charCodeAt(i);
      prefix = d < 256 ? c : dict[d] || (prefix + curChar);
      out.push(prefix);
      curChar = prefix.charAt(0);
      dict[idx += 1] = oldPrefix + curChar;
      oldPrefix = prefix;
    } else if (Object.prototype.hasOwnProperty.call(dict, prefix + c)) {
      prefix += c;
    } else {
      g();
      idx += 1
      dict[prefix + c] = idx;
      prefix = c;
    }
  }
  if (!f) g();
  return out.join('');
}
// 压缩时：xcode('watchwatch....');
// 解压时：xcode('compressed string',true);//第二个参数传true表示解压，反之为压缩
module.exports = {
  LZW
}