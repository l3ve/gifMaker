(function () {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||    // name has changed in Webkit
            window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
            var id = window.setTimeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }


}());
function ele(elm) {
    return document.querySelector(elm);
}

zweiGif = (function () {

    var video = ele("#zweiVideo"),
        canvas = document.createElement("canvas"),
        i,
        w = 100,
        h = 100,
        status = "start",
        gif = new GIF({
            workers: 4,
            quality: 10,
            workerScript: 'gif.worker.js'
        });


    function Zweigif() {
    }

    function loop() {
        canvas.getContext("2d").drawImage(video, 0, 0, w, h);
        gif.addFrame(canvas, {copy: true, delay: 20});
        i = requestAnimationFrame(loop);
    }

    document.onkeydown = function () {
        console.log(window.event.keyCode);
        if (window.event && window.event.keyCode == 32) {
            event.cancelBubble = true;
            makeGif();
        }
    };

    function makeGif() {
        if (status == "start") {
            gif.abort();
            gif.frames = [];
            i = loop();
            document.querySelector("#drag").classList.add("flashing");
            ele("#per").innerHTML = "录制中！~";

            status = "end";
            this.innerHTML = "end";
        } else {
            cancelAnimationFrame(i);
            gif.render();
            status = "start";
            this.innerHTML = "start";
        }
    }

    canvas.width = w;
    canvas.height = h;
//视频转gif
    Zweigif.prototype.makeGif = function () {

        gif.on('finished', function (blob) {
            var img = document.createElement("img"),
                div = document.createElement("div");
            img.setAttribute("src", URL.createObjectURL(blob));
            div.setAttribute("class", "box");
            div.appendChild(img);
            ele("#video-gif").appendChild(div);
            document.querySelector("#drag").classList.remove("flashing");

            //消除子元素继承父元素的事件
            img.addEventListener('click', function (e) {
                e.stopPropagation();
            }, false);
            div.addEventListener('click', function () {
                div.parentNode.removeChild(div);
            }, false);

        });
        gif.on('progress', function (p) {
            if (p == 1) {
                ele("#per").innerHTML = "已完成！~";
            } else {
                ele("#per").innerHTML = Math.round(p * 100) + "%";
            }
        });
    };

    Zweigif.prototype.setGif = function (neww, newh) {
        gif = null;
        w = neww;
        h = newh;
        canvas.width = w;
        canvas.height = h;
        gif = new GIF({
            workers: 4,
            quality: 1,
            workerScript: 'gif.worker.js',
            width: neww,
            height: newh
        });
    };

    return new Zweigif();
})();


var newh = ele('#gif_h'),
    neww = ele('#gif_w');
zweiGif.makeGif();



ele('#file').addEventListener("change", function (evt) {
    ele("#zweiVideo").setAttribute("src", this.value);
}, false);

ele('#file_btn').addEventListener("click", function () {
    ele("#file").click();
}, false);

ele('#reset_btn').addEventListener('click', function () {
    zweiGif.setGif(parseInt(neww.value), parseInt(newh.value));
    zweiGif.makeGif();
});

ele("#close").addEventListener('click', function () {
    win.close();
}, false);
