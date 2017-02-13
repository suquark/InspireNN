import { InputLayer } from 'layers/layer.js';
import { PoolLayer } from 'layers/pool.js';
import { FullyConnLayer } from 'layers/fullconn.js';
import { ConvLayer } from 'layers/conv.js';
import { LocalResponseNormalizationLayer } from 'layers/normalization.js';
import { DropoutLayer } from 'layers/dropout.js';
import { DeconvLayer } from 'layers/deconv.js';

import getActivation from 'layers/activation.js'; 

function merge(dst, src) {
    for (let k of Object.keys(src)) {
        dst[k] = src[k];
    }
}

var layer_dict = {
    'input' : InputLayer,
    'dropout' : DropoutLayer,
    'conv' : ConvLayer,
    'deconv' : DeconvLayer,
    'pool' : PoolLayer,
    'lrn'  : LocalResponseNormalizationLayer,
    'fc' : FullyConnLayer
};

merge(layer_dict, getActivation());

export function get_layer(opt) {
    return new layer_dict[opt.type || opt.layer_type](opt);
}