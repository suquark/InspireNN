function vis_net_input(canvas, netin) {
    var ctx = canvas.getContext("2d");
    var W = canvas.width;
    var H = canvas.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgb(0,0,0)";
    //ctx.font="12px Verdana";
    //ctx.fillText("Current state:",10,10);
    ctx.lineWidth = 10;
    ctx.beginPath();
    for (let k in netin) {
        ctx.moveTo(10 + k * 12, 120);
        ctx.lineTo(10 + k * 12, 120 - netin[k] * 100);
    }
    ctx.stroke();
} 

export { vis_net_input };
