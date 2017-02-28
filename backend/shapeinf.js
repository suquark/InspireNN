/**
 * return output shape
 */
function matmul(u_shape, v_shape) {
    u_shape = u_shape.slice();
    v_shape = v_shape.slice();
    u_shape.pop();
    let tail = v_shape.pop();
    v_shape.pop();
    v_shape.push(tail);
    return u_shape.concat(v_shape);
}