import { VisElement } from 'visualize/basicvis.js';

/**
 * Equation
 */
class Equation extends VisElement {
    constructor(s) {
        super();
        if (typeof MathJax === 'undefined')
            throw Error('Equation(): Equation depends on the MathJax library,' +
                  ' which does not seem to be in scope.');

        this.s = this.make_selector(s);
        this.inner = this.s.append('div');
        this._text = '';

        // Create empty MathJax Equation:
        // Create an empty <script type='math/tex'></script>
        // Then tell MathJax to look for it when it has time.
        // (In case page is already loaded when we're constructed.)
        this.inner.append('script')
            .attr('type', 'math/tex')
            .text('');
        MathJax.Hub.Queue(['Process', MathJax.Hub, this.inner.node()]);
    }

    layout() { return this; }
    render() {
        var node = this.inner.node();
        var eq = MathJax.Hub.getAllJax(node);
        // MathJax might not be done rendering!
        // Has it made our ElementJax yet?
        if (!eq.length) {
            // No? Let's try again later.
            this.scheduleUpdate(100);
        } else {
            // We schedule updating an equation wiht MathJax.
            MathJax.Hub.Queue(['Text', eq[0], this._text]);
        }
        return this;
    }

    latex(val) {
        if (!arguments.length) return this._text;
        this._text = val;
        this.scheduleUpdate();
        return this;
    }
}
 
