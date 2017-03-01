import { matmul } from 'backend/tensor.js';

/**
 * return output shape
 */



var shape_map = new Map();

shape_map.set(matmul, (u_shape, v_shape) => {
    u_shape = u_shape.slice();
    v_shape = v_shape.slice();
    u_shape.pop();
    // remove item @ -2
    let tail = v_shape.pop();
    v_shape.pop();
    v_shape.push(tail);
    return u_shape.concat(v_shape);
});


export default function(ops) {
    return shape_map.get(ops);
};