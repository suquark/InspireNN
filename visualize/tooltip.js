import { ImgDisplay } from 'visualize/imgdisplay.js';

/**
 * ToolTip
 */
class Tooltip {
    constructor() {
        this.div = d3.select('body').append('div')
            .style("position", "absolute");
        this.hide();
        this.timeout = null;
        this.div.on("mouseover", () => {
            var pos = [d3.event.pageX + 10, d3.event.pageY + 10];
            this.move(pos);
        });
    }

    size(val) {
        if (!arguments.length) return this.div.style("width");
        this.div.style("width", val);
        return this;
    }
    move(val) {
        this.div
            .style("left", val[0])
            .style("top", val[1]);
        return this;
    }
    unhide() {
        this.div
            .style("visibility", "visible")
            .style("z-index", "10");
        //throw Error("just debugging");
        return this;
    }
    hide() {
        this.div.style("visibility", "hidden");
        return this;
    }
    bind(s, cond) {
        var this_ = this;
        var timeout = null;
        var show = function (i) {
            if (cond && !cond(i)) {
                return;
            }
            clearTimeout(timeout);
            this_.timeout = null;
            var pos = [d3.event.pageX + 10, d3.event.pageY + 10];
            this_.move(pos);
            this_.display(i);
            this_.unhide();
        };
        s.on("mouseover", show);
        s.on("mousemove", show);
        s.on("mouseout", function (i) {
            if (!this_.timeout)
                this_.timeout = setTimeout(function () { this_.hide(); this_.timeout = null; }, 300);
        });
    }
    bind_move(s) {
        var this_ = this;
        s.on("mousemove", function () {
            var pos = [d3.event.pageX + 10, d3.event.pageY + 10];
            this_.move(pos);
        });
    }

}

/**
 * ImgTooltip
 */
class ImgTooltip extends Tooltip {
    constructor() {
        super();
        // this.div.style("border", "1px solid black");
        this.img_display = new ImgDisplay(this.div);
        this.size("40px");
    }
    size(val) {
        if (!arguments.length) return this.div.style("width");
        this.div.style("width", val);
        this.img_display.scheduleUpdate();
        return this;
    }

    display(i) {
        this.img_display.show(i);
        return this;
    }

}

/**
 * TextTooltip
 */
class TextTooltip extends Tooltip {
    constructor() {
        super();
        this._labels = [];
        this.div
            .style("background-color", "white")
            .style("font-size", "130%")
            .style("padding-left", "2px")
            .style("padding-right", "2px")
            .style("padding-top", "1px")
            .style("padding-bottom", "1px")
            .style("border", "1px solid black");
    }

    display(i) {
        var labels = this._labels;
        if (i < labels.length){
            this.div.text(labels[i]);
        } else {
            this.div.text("");
        }
        return this;
    }

}

export { Tooltip, ImgTooltip, TextTooltip };
