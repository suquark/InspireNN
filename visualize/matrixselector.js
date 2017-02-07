
/**
 * MatrixSelector
 */
class MatrixSelector extends VisElement {
    constructor(s) {
        this.s = this.make_selector(s);
        this.svg = this.s.append('svg');
        this._data = {};
        this._data.shape = null;
        this._data.value = [-1, -1];
        this._data.pixels = null;
        this.value = (val) => {
            if (!arguments.length) return this._data.value;
            this._data.value = val;
            this.value.change(val);
            this.scheduleUpdate();
            return this;
        };
        this.value.change = function () { };
    }

    layout() {
        var W = parseInt(this.s.style('width'));
        this.svg
            .style('border', '1px solid #000000')
            .style('width', 1.0 * W)
            .style('height', 1.0 * W);
        return this;
    }

    render() {
        var pixels = this._data.pixels;
        var shape = this._data.shape;
        if (!shape) throw Error('ImgDisplay.render():' +
            ' Set shape first with ImgDisplay.shape()');
        var value = this._data.value;
        var this_ = this;

        var selection = this.svg.selectAll('rect')
            .data(pixels);

        var W = parseInt(this.s.style('width'));
        var H = parseInt(this.s.style('height'));

        // create new rects on svg
        selection.enter().append('rect')
            .style('fill', 'blue')
            .on('click', function (d, i) {
                this_.value(d);
            });
        // remove old ones from svg
        selection.exit().remove();
        // update/reset rects properties
        selection
            .attr('width', W / shape[0])
            .attr('height', H / shape[1])
            .attr('x', function (d, i) { return W * d[0] / shape[0]; })
            .attr('y', function (d, i) { return H * (1 - d[1] / shape[1]); })
            .classed('hover_show', function (d, i)
            { return d[0] != value[0] || d[1] != value[1]; });

        return this;

    }

    get shape() {
        return this._data.shape;
    }

    set shape(val) {
        if (!val[0] || !val[1])
            throw Error('shape(): shape must be an array of length 2 or 3.' +
                ' For example, [28, 28] or [32, 32, 3]');
        this._data.shape = val;
        this._data.pixels = [];
        for (var i = 0; i < val[0]; i++) {
            for (var j = 0; j < val[1] + 1; j++) {
                this._data.pixels.push([i, j]);
            }
        }
        return this;
    }

}

