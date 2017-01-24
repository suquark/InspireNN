import { Layer } from 'layers/layer.js'
import { Vol } from 'vol.js'
import {getopt} from 'util.js'

var get_deconv_outsize = function(size, k, s, p) {
    return s * (size - 1) + k - 2 * p;
}

class DeconvLayer extends Layer {
    constructor (opt) {
        // sx, sy : filter size in x, y dims
        // in_depth : depth of input volume
        opt.serialize = ['sx', 'sy', 'stride', 'in_depth', 'pad', 'l1_decay_mul', 'l2_decay_mul'];
        super('deconv', opt);

        // required
        this.out_depth = opt.filters;
        this.sx = opt.sx; // filter size. Should be odd if possible, it's cleaner.
        this.in_depth = opt.in_depth;
        this.in_sx = opt.in_sx;
        this.in_sy = opt.in_sy;

        // optional, like pooling layer
        this.sy = getopt(opt, 'sy', this.sx);
        this.stride = getopt(opt, 'stride', 1); // 1 not 2 in pool
        this.pad = getopt(opt, 'pad', 0); // amount of 0 padding to add around borders of input volume
        this.l1_decay_mul = getopt(opt, 'l1_decay_mul', 0.0);
        this.l2_decay_mul = getopt(opt, 'l2_decay_mul', 1.0);

        // computed
        // note we are doing floor, so if the strided convolution of the filter doesnt fit into the input
        // volume exactly, the output volume will be trimmed and not contain the (incomplete) computed
        // final application.
        if(typeof opt.out_sx !== 'undefined') {
            this.out_sx = opt.out_sx;
        } else {
            this.out_sx = get_deconv_outsize(this.in_sx, this.sx, this.stride, this.pad);
        }
        if(typeof opt.out_sy !== 'undefined') {
            this.out_sy = opt.out_sy;
        } else {
            this.out_sy = get_deconv_outsize(this.in_sy, this.sy, this.stride, this.pad);
        }
     
      
        // initializations
        let bias = getopt(opt, 'bias_pref', 0.0);
        this.filters = [];
        for (var i = 0; i < this.out_depth; i++) 
        { 
            this.filters.push(new Vol(1, 1, this.in_depth)); 
        }
        this.biases = new Vol(1, 1, this.out_depth, bias);

        // record updated values for updating
        this.updated = this.filters.concat([this.biases]);
    }

    forward(V, is_training) {
        // optimized code by @mdda that achieves 2x speedup over previous version
        // optimized code by @mdda that achieves 2x speedup over previous version
       // console.log(V);
        this.in_act = V;
        var A = new Vol(this.out_sx |0, this.out_sy |0, this.out_depth |0, 0.0);

        var V_sx = this.in_sx |0;
        var V_sy = this.in_sy |0;
        var V_depth = this.in_depth;
        var xy_stride = this.stride |0;

        for (var d = 0; d < this.out_depth; d++) {
            var f = this.filters[d];
            for (var ay = 0; ay < this.in_sy; y++ , ay++) {  // xy_stride
                var y = (ay * xy_stride - this.pad) | 0;
                for (var ax = 0; ax < this.in_sx; x += xy_stride, ax++) {  // xy_stride
                    var x = (ax * xy_stride - this.pad) | 0;
                    // convolve centered at this particular location
                    for (var fy = 0; fy < f.sy; fy++) {
                        var iy = y + fy; // coordinates in the original input array coordinates
                        for (var fx = 0; fx < f.sx; fx++) {
                            var ix = x + fx;
                            if (iy >= 0 && iy < A.sy && ix >= 0 && ix < A.sx) {
                                for (var fd = 0; fd < V_depth; fd++) {
                                    var a = f.w[((f.sx * fy) + fx) * V_depth + fd] * V.w[((V_sx * ay) + ax) * V_depth + fd];
                                    A.w[((A.sx * iy) + ix) * A.depth + d] += a;
                                }
                            }
                        }
                    }
                }
            }
            for (var ay = 0; ay < this.out_sy; y++ , ay++) {  // xy_stride
                for (var ax = 0; ax < this.out_sx; x++ , ax++) {  // xy_stride
                    A.w[((A.sx * ay) + ax) * A.depth + d] += this.biases.w[d];
                }
            }
        }
        this.out_act = A;
        return this.out_act;
    }

    backward() {
        // Not implement
    }
    
    getParamsAndGrads() {
        let response = this.filters.map(x => this._pack_vars(x));
        response.push(this._pack_vars(this.biases, false)); 
        return response;
    }

    toJSON() {
        var json = super.toJSON();
        json.filters = this.filters.map(x => x.toJSON());
        json.biases = this.biases.toJSON();
        return json;
    }

    fromJSON(json) {
        super.fromJSON(json);

        this.pad = getopt(json, 'pad', 0); 
        this.l1_decay_mul = getopt(json, 'l1_decay_mul', 0.0);
        this.l2_decay_mul = getopt(json, 'l2_decay_mul', 1.0);
        
        this.filters = json.filters.map(x => new Vol(0,0,0,0).fromJSON(x));
        this.biases = new Vol(0,0,0,0).fromJSON(json.biases);
    }

}

export { DeconvLayer };
