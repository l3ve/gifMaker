const cv = require('opencv')
const GREEN = [0, 255, 0];

cv.readImage('./js.png', (err, img) => {
  if (err) throw err
  if (img.width() < 1 || img.height() < 1) throw new Error('Image has no size');
  console.log(img.contours);
  let contours = img.contours();
  let largestContourImg;
  let largestArea = 0;
  let largestAreaIndex;
  largestContourImg = new cv.Matrix('252', '428');

  for (let i = 0; i < contours.length; i += 1) {
    if (contours.area(i) > largestArea) {
      largestArea = contours.area(i);
      largestAreaIndex = i;
    }
  }
  largestContourImg.drawContour(contours, largestAreaIndex, GREEN, 1, 8, 0, [0, 0])
  img.save('./newJs.jpg');
})