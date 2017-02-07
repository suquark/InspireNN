import { VisElement } from 'visualize/basicvis.js';

/**
 * Container
 */
class Container extends VisElement {
    constructor(s) {
        super();
        this.s = this.make_selector(s);
        this.inner = this.s.append('div');
        this._children = [];
        this._children_divs = [];
    }

    new_child(constructor) {
        var child_div = this.inner.append('div');
        child_div.pos = function pos(v) {
            child_div.style('left', v[0]).style('top', v[1]);
            return child_div;
        };
        child_div.size = function size(v) {
            child_div.style('width', v[0]).style('height', v[1]);
            return child_div;
        };
        var child = new constructor(child_div);
        child.div = child_div;
        this._children_divs.push(child_div);
        this._children.push(child);
        this.scheduleUpdate();
        return child;
    }

    layout() {
        var W = parseInt(this.s.style('width'));
        this.inner
        .style('width', 1.0 * W)
        .style('position', 'relative');
        if (!this.child_layout)
        throw Error('Container: Must implement child_layout()' +
                    ' to position and size child divs.');
        for (var i = 0; i < this._children.length; i++) {
        this._children_divs[i]
            .style('position', 'absolute');
        }
        this.child_layout();
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
    
}

export { Container };