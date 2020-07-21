let video = document.querySelector('#video')
let video_input = document.querySelector('#video-input')
let btn = document.querySelector('.cute')
let canvas = document.createElement('canvas')
let ctx = canvas.getContext("2d")
let i = 0
let video_width = 0
let video_height = 0
document.body.appendChild(canvas)



video_input.addEventListener('change', function (e) {
  let { target: { files } } = e
  video.setAttribute('src', URL.createObjectURL(files[0]))
})
video.addEventListener('canplay', function (e) {
  let { clientHeight, clientWidth } = e.target
  video_width = clientWidth
  video_height = clientHeight
  canvas.width = clientWidth
  canvas.height = clientHeight
  setTimeout(() => { loop() }, 3000)
  video.play()
})
btn.addEventListener('click', () => {
  getImageData()
})

function loop() {
  ctx.drawImage(video, 0, 0, video_width, video_height)
  // getImageData()
  // i = requestAnimationFrame(loop);
}

function getImageData() {
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  let _tempObj = {}
  let image_color = []
  let _len = imageData.length
  let color_index = 0
  for (let i = 0; i < _len; i = i + 4) {
    let color = `${imageData[i]},${imageData[i + 1]},${imageData[i + 2]}`
    // 暂时不处理透明
    // let opacity = `${imageData[i+3]}`
    if (_tempObj.hasOwnProperty(color)) {
      image_color.push(_tempObj[color])
    } else {
      _tempObj[color] = color_index
      image_color.push(color_index)
      color_index = color_index + 1
    }
  }
  let color_table = Object.keys(_tempObj)
  console.log(color_table, image_color)
}
// setTimeout(() => {
//   cancelAnimationFrame(i);
// }, 10000);

// const js = import("./gif_maker");
// js.then(js => {
//   js.greet("World!");
// });