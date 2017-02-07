import { VisElement } from 'visualize/basicvis.js';

/** 
 * ScatterPlot 
 */
class ScatterPlot extends VisElement {
    constructor(s) {
        this.s = this.make_selector(s);
        this.svg = this.s.append('svg');
        this.zoom_g = this.svg.append('g');

        this._data = {};
        this._data.N = 0;
        this._data.scale = 1;
        this._data.color = function() {return 'rgb(50,50,50)';};
        this._data.x = function() {return 0;};
        this._data.y = function() {return 0;};
        this._data.size = function() {return 0;};
        this._data.mouseover = function() {};

        this._data.xrange = null;
        this._data.yrange = null;

        this.xmap = d3.scale.linear();
        this.ymap = d3.scale.linear();

        this.zoom = d3.behavior.zoom()
                    .on("zoom", () => {this._zoomed();});

        this.xrange.fit = (data) => {
            var x1 = d3.min(data);
            var x2 = d3.max(data);
            var dx = x2 - x1;
            this.xrange([x1-0.02*dx, x2+0.02*dx]);
            return this;
        };

        this.yrange.fit = (data) => {
            var x1 = d3.min(data);
            var x2 = d3.max(data);
            var dx = x2 - x1;
            this.yrange([x1-0.02*dx, x2+0.02*dx]);
            return this;
        };
    }

    layout() {
        var W = parseInt(this.s.style('width'));
        this.svg.style('width', W).style('height', W);
        var H = parseInt(this.s.style('height'));
        var D = Math.min(W, H) / 2 - 2;
        this.xmap.range([W / 2 - D, W / 2 + D]);
        this.ymap.range([H / 2 - D, H / 2 + D]);
        return this;
    }

    render() {
        var data = this._data;
        var this_ = this;
        var selection = this.zoom_g.selectAll('circle')
                    .data(d3.range(data.N));
        this.points = selection;


        var W = parseInt(this.svg.style('width'));
        var H = parseInt(this.svg.style('height'));
        var D = Math.min(W, H) / 2 - 2;


        // create new circles on svg
        selection.enter().append('circle')
            .attr('r', 0)
            .classed({'highlight' : true})
            .on('mouseover', this._data.mouseover);
        var size = data.size()/Math.pow(data.scale, 0.7);
        // remove old circles from svg
        selection.exit().remove();
        // update/reset circle properties
        selection.transition().duration(200)
            .attr('cx', function(d, i) { return this_.xmap(data.x(i)); })
            .attr('cy', function(d, i) { return this_.ymap(data.y(i)); });
        selection.attr('r', size).attr('fill', data.color);
        return this;

    }

    N(val) {
        if (!arguments.length) return this._data.N;
        this._data.N = val;
        this.scheduleUpdate();
        return this;
    }

    color(val) {
        if (!arguments.length) return this._data.color;
        this._data.color = make_function(val);
        this.scheduleUpdate();
        return this;
    }

    sizefunction(val) {
        if (!arguments.length) return this._data.size;
        this._data.size = make_function(val);
        this.scheduleUpdate();
        return this;
    }

    x(val) {
        if (!arguments.length) return this._data.x;
        this._data.x = make_function(val);
        this.scheduleUpdate();
        return this;
    }

    y(val) {
        if (!arguments.length) return this._data.y;
        this._data.y = make_function(val);
        this.scheduleUpdate();
        return this;
    }

    xrange(val) {
        if (!arguments.length) return this._data.xrange;
        if (!(val.length == 2)) {
        if (val.length > 5)
            throw Error('xrange(): yrange must be an array of length 2.' +
                        ' For example, [-1, 1]. Did you mean to use xrange.fit()?');
        throw Error('xrange(): yrange must be an array of length 2.' +
                    ' For example, [-1, 1].');
        }
        this._data.xrange = val;
        this.xmap.domain(val);
        this.scheduleUpdate();
        return this;
    }

    yrange(val) {
        if (!arguments.length) return this._data.yrange;
        if (!(val.length == 2)) {
        if (val.length > 5)
            throw Error('yrange(): yrange must be an array of length 2.' +
                    ' For example, [-1, 1]. Did you mean to use yrange.fit()?');
        throw Error('yrange(): yrange must be an array of length 2.' +
                    ' For example, [-1, 1].');
        }
        this._data.yrange = val;
        this.ymap.domain(val);
        this.scheduleUpdate();
        return this;
    }

    mouseover(val) {
        if (!arguments.length) return this._data.mouseover;
        this._data.mouseover = val;
        this.scheduleUpdate();
        return this;
    };

    enable_zoom() {
        this.svg.call(this.zoom);
        return this;
    }

    _zoomed() {
        this.zoom_g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale +")");
        this._data.scale = d3.event.scale;
        this.scheduleUpdate();
    }
}

export { ScatterPlot };