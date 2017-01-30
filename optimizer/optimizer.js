import { getopt } from 'util.js';
import { zeros } from 'util/array.js';
const eps = 1e-8;  // eps added for better conditioning

class grad_optimizer {
    constructor(len, opt={}) { }
    update(x, g) { }
    grad(g) {
        let dx = zeros(g.length);
        this.update(dx, g);
        return dx;
    }
}

export { eps, grad_optimizer };
