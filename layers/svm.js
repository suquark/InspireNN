import { OutputLayer } from 'layer'
import { zeros } from '../convnet_util'

class SVMLayer extends OutputLayer {
    
    constructor(opt) { super('svm', opt); }

    backward(y) {
        // compute and accumulate gradient wrt weights and bias of this layer
        let x = this.in_act;
        x.dw = zeros(x.w.length); // zero out the gradient of input Vol

        // we're using structured loss here, which means that the score
        // of the ground truth should be higher than the score of any other 
        // class, by a margin
        let yscore = x.w[y]; // score of ground truth
        let margin = 1.0;
        let loss = 0.0;
        for (let i = 0; i < this.out_depth; i++) {
            if (y === i) continue; 
            let ydiff = -yscore + x.w[i] + margin;
            if (ydiff > 0) {
                // violating dimension, apply loss
                x.dw[i] += 1;
                x.dw[y] -= 1;
                loss += ydiff;
            }
        }
        return loss;
    }
}

export { SVMLayer };
