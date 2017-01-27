import { normalize_angle } from 'util.js';
import { Face, Vec } from '../geometry.js';

class TwoWheelMotor {

    constructor(face) {
        this.actions = [];
        this.actions.push([1, 1]);
        this.actions.push([0.8, 1]);
        this.actions.push([1, 0.8]);
        this.actions.push([0.5, 0]);
        this.actions.push([0, 0.5]);
        // fix to the body
        this.face = face;
    }

    steer(action) {
        let actionx = this.actions[action];
        let rot1 = actionx[0], rot2 = actionx[1];
        let face = this.face;

        let pos = face.origin;
        let angle = face.angle;
        // steer the agent according to outputs of wheel velocities
        var v = new Vec(0, face.rad / 2.0).rotate(angle + Math.PI / 2);
        var w1p = pos.add(v); // position of wheel 1
        var w2p = pos.sub(v); // position of wheel 2

        var vv = pos.sub(w2p).rotate(-rot1);
        var vv2 = pos.sub(w1p).rotate(rot2);

        var np = w2p.add(vv);
        var np2 = w1p.add(vv2);
        let npos = np.add(np2);
        npos.scale(0.5);
        
        let nangle = normalize_angle(angle - rot1 + rot2);
        return new Face(npos.x, npos.y, face.rad, nangle);
    }
}

export { TwoWheelMotor };
