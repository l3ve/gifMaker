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

zweiGif = (function () {

    var video = document.querySelector("#zweiVideo"),
        canvas = document.createElement("canvas"),
        i,
        status = "start",
        gif = new GIF({
            workers: 4,
            quality: 10,
            workerScript: 'gif.worker.js'
        }),
        w = 100,
        h = 100;

    function Zweigif() {
    }

    canvas.width = w;
    canvas.height = h;
//视频转gif
    Zweigif.prototype.getGif = function () {

        function loop() {
            canvas.getContext("2d").drawImage(video, 0, 0, w, h);
            gif.addFrame(canvas, {copy: true, delay: 20});
            i = requestAnimationFrame(loop);
        }

        gif.on('finished', function (blob) {
            var img = document.createElement("img"),
                div = document.createElement("div");
            img.setAttribute("src", URL.createObjectURL(blob));
            div.setAttribute("class", "box");
            div.insertBefore(img);
            document.querySelector("#video-gif").insertBefore(div);

            img.addEventListener('click', function (e) {
                e.stopPropagation();
            }, false);
            div.addEventListener('click', function () {
                div.parentNode.removeChild(div);
            }, false);

        });
        gif.on('progress', function (p) {
            document.querySelector("#per").innerHTML = Math.round(p * 100) + "%";
        });


        document.querySelector("#b_btn").addEventListener('click', function () {
            if (status == "start") {
                gif.abort();
                gif.frames = [];
                i = loop();
                status = "end";
                this.innerHTML = "end";
            } else {
                cancelAnimationFrame(i);
                gif.render();
                status = "start";
                this.innerHTML = "start";
            }
        }, false);
    };

    Zweigif.prototype.setGifwh = function () {

    };

    return new Zweigif();
})();


var gui = require('nw.gui'),
    win = gui.Window.get();

zweiGif.getGif();


document.querySelector("#close").addEventListener('click', function () {
    win.close();
}, false);

document.querySelector('#file').addEventListener("change", function (evt) {
    document.querySelector("#zweiVideo").setAttribute("src", this.value);
}, false);

document.querySelector('#file_btn').addEventListener("click", function () {
    document.querySelector("#file").click();
}, false);