class Animate1DPlot {

    constructor(plot1d, path, accurate = 50) {
        this.path = path;
        this.accurate = accurate;
        this.old_points = [];
        this.duration = 100;
        this.plot1d = plot1d;
    }

    draw(f, accurate = this.accurate) {
        let [points, line] = this.plot1d.getPointsAndLine(f, accurate);
        this.path.attr('d', line(points));
        this.old_points = points;
    }

    animate(f, duration) {
        if (typeof duration === 'undefined') duration = this.duration;
        let [points, line] = this.plot1d.getPointsAndLine(f, accurate);
        this.path.datum(points)
            .attr('d', line(this.old_points)).transition().delay(0).duration(duration)
            .attrTween('d', function(d) {
                return d3.interpolatePath(d3.select(this).attr('d'), line(d));
            });
        this.old_points = points;
    }

}


class Plot1D {
    constructor(selector, range) {
        this.svg = typeof selector === 'string' ? d3.select(selector) : selector;
        this.shadowg = this.svg.append('g');
        this.g = this.svg.append('g');
        this.spanx = x => 50 * x;
        this.spany = y => 50 * y;
        this.plot_count = 0;
        this.range = range;
    }

    get width() {
        return this.svg.node().getBBox().width;
    }

    get height() {
        return this.svg.node().getBBox().height;
    }

    drawPoints(points) {
        var g = this.shadowg;
        g.selectAll("*").remove();
        for (let { x, y }
            of points) {
            g.append("circle")
                .style("stroke", "gray")
                .style("fill", "black")
                .attr("r", 2)
                .attr("cx", this.spanx(x))
                .attr("cy", this.spany(y));
        }
    }

    getPointsAndLine(f, accurate = 50) {
        let [left, right] = this.range;
        var points = d3.ticks(left, right, accurate).map(x => ({ x: x, y: f(x) }));
        var line = d3.line().curve(d3.curveBasis).x(d => this.spanx(d.x)).y(d => this.spany(d.y));
        return [points, line];
    }

    setSpan(f, width, height, accurate = 100) {
        let [left, right] = this.range;
        var points = d3.ticks(left, right, accurate).map(x => ({ x: x, y: f(x) }));
        this.spanx = d3.scaleLinear().domain(d3.extent(points, d => d.x)).range([width * 0.1, width * 0.9]);
        this.spany = d3.scaleLinear().domain(d3.extent(points, d => d.y)).range([height * 0.9, height * 0.1]);
    }

    createPlot(accurate = 50, duration = 100) {
        var path = this.g.append('path').style('stroke', d3.schemeCategory10[this.plot_count]);
        this.plot_count++;
        return new Animate1DPlot(this, path, accurate);
    }

}

export { Plot1D };