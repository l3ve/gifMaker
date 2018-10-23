let video = document.querySelector('#video')
let video_input = document.querySelector('#video-input')
let canvas = document.createElement('canvas')
let ctx = canvas.getContext("2d")
let i = 0
let video_width = 0
let video_height = 0
document.body.appendChild(canvas)



video_input.addEventListener('change', function (e) {
  let { target: { files } } = e
  video.setAttribute('src', files[0].path)
})
video.addEventListener('canplay', function (e) {
  let { clientHeight, clientWidth } = e.target
  video_width = clientWidth
  video_height = clientHeight
  canvas.width = clientWidth
  canvas.height = clientHeight
  loop()
  video.play()
})

function loop() {
  ctx.drawImage(video, 0, 0, video_width, video_height)
  i = requestAnimationFrame(loop);
}


setTimeout(() => {
  cancelAnimationFrame(i);
}, 10000);

// const js = import("./gif_maker");
// js.then(js => {
//   js.greet("World!");
// });