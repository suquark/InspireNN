/**
 * Export optimizers
 */
import { getopt } from 'util.js';
// Norm + Nesterov
import { Nadam } from 'optimizer/nadam.js';
export { Nadam };
// Norm + Momentum
import { Adam } from 'optimizer/adam.js';
import { Adamax } from 'optimizer/adamax.js';
import { Adadelta } from 'optimizer/adadelta.js';
export { Adam, Adamax, Adadelta };
// Norm-based
import { Adagrad } from 'optimizer/adagrad.js';
import { RMSProp } from 'optimizer/rmsprop.js';
export { Adagrad, RMSProp };
// Nesterov-based
import { Nesterov } from 'optimizer/nesterov.js';
export { Nesterov };
// Momentum-based
import { SGD } from 'optimizer/sgd.js';
import { SpecialSGD } from 'optimizer/special.js';
export { SGD, SpecialSGD };

var optimizers = {
    'adam': Adam,
    'adamax': Adamax,
    'adagrad': Adagrad,
    'rmsprop': RMSProp,
    'adadelta': Adadelta,
    'nesterov': Nesterov,
    'sgd': SGD,
    'specialsgd': SpecialSGD
};

export default function (size, opt) {
    let name = getopt(opt, 'method', 'sgd');
    return new optimizers[name](size, opt);
};
