
class PoolLayer extends Layer {
    // An inefficient dropout layer
    // Note this is not most efficient implementation since the layer before
    // computed all these activations and now we're just going to drop them :(
    // same goes for backward pass. Also, if we wanted to be efficient at test time
    // we could equivalently be clever and upscale during train and copy pointers during test
    // todo: make more efficient.
    constructor(opt) { 
        opt.serialize = ['drop_prob'];
        super('dropout', opt);
        this.drop_prob = typeof opt.drop_prob !== 'undefined' ? opt.drop_prob : 0.5;
        this.dropped = this.createOutput();
    }

    forward(V, is_training=false) {
        this.in_act = V;
        var V2 = V.clone();
        if (is_training) {
            // do dropout
            for (let i = 0; i < V.length; i++) {
                this.dropped[i] = (Math.random()<this.drop_prob);
                if (this.dropped[i]) V2.w[i] = 0; 
            }
        } else {
            // scale the activations during prediction
            V2.scale(this.drop_prob);
        }
        this.out_act = V2;
        return this.out_act; // dummy identity function for now
    }

    backward() {
        let V = this.in_act; // we need to set dw of this
        let chain_grad = this.out_act;
        V.dw.fill(0.); // zero out gradient wrt data
        for (let i = 0; i < V.length; i++) {
            if(!(this.dropped[i])) { 
                V.dw[i] = chain_grad.dw[i]; // copy over the gradient
            }
        }
    }
}
  

export { DropoutLayer };
