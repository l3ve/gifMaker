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

//
var gui = require('nw.gui'),
    win = gui.Window.get(),
    status = "start";

document.querySelector('#file').addEventListener("change", function (evt) {
    document.querySelector("#video").setAttribute("src",this.value);
}, false);



//视频转gif
getGif("video", 320, 175);


function getGif(videoID, w, h) {
    var gif = new GIF({
            workers: 4,
            quality: 10,
            workerScript: 'gif.worker.js',
            width: w,
            height: h
        }),
        video = document.querySelector("#" + videoID),
        i;

    function loop() {
        gif.addFrame(video, {copy: true, delay: 20});
        i = requestAnimationFrame(loop);
    }

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


    gif.on('finished', function (blob) {
        var img = document.createElement("img"),
            del = document.createElement("i"),
            div = document.createElement("div");
        img.setAttribute("src", URL.createObjectURL(blob));
        div.setAttribute("class", "box");
        del.setAttribute("class", "btn del_btn");
        del.innerHTML = "Del";
        div.insertBefore(img);
        div.insertBefore(del);

        document.querySelector("#video-gif").insertBefore(div, document.querySelector("#video"));

        del.addEventListener('click', function () {
                del.parentNode.parentNode.removeChild(del.parentNode);
        }, false);

    });
    gif.on('progress', function (p) {
        document.querySelector("#per").innerHTML = Math.round(p * 100) + "%";
    });
}


document.querySelector("#close").addEventListener('click', function () {
    win.close();
}, false);

