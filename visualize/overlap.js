import { VisElement } from 'visualize/basicvis.js';


/**
 * Overlap
 */
class Overlap extends VisElement {
    constructor() {
        super();
        this.s = this.make_selector(s);
        this.inner = this.s.append('div');
        this._children = [];
        this._children_divs = [];
    }

    layout() {
        var W = parseInt(this.s.style('width'));
        this.inner
            .style('width', 1.0 * W)
            .style('height', 1.0 * W)
            .classed('overlap_inner', true)
            .style('position', 'relative');
        for (var i = 0; i < this._children_divs.length; i++) {
            this._children_divs[i]
                .style('position', 'absolute')
                .style('width', 1.0 * W)
                .style('height', 1.0 * W)
                .style('top', 0)
                .style('left', 0);
        }
        for (var i = 0; i < this._children.length; i++) {
            this._children[i].layout();
        }
        return this;
    }
    render() {
        for (var i = 0; i < this._children.length; i++) {
            this._children[i].render();
        }
        return this;
    }
    new_child(constructor) {
        var child_div = this.inner.append('div');
        var child = new constructor(child_div);
        this._children_divs.push(child_div);
        this._children.push(child);
        this.scheduleUpdate();
        return child;
    }
}
 
export { Overlap };