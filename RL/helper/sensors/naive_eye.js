import { Line, Face, Vec } from '../geometry.js';

class SingleEye {
    // Eye sensor has a maximum range and senses walls
    constructor(angle, face) {
        this.angle = angle; // angle relative to agent its on
        this.face = face;
        this.max_range = 85;
        this.sensed_proximity = 85; // what the eye is seeing. will be set in world.tick()
        this.sensed_type = -1; // what does the eye see?
        // this.origin
    } 

    get line_of_sight() {
        let origin = this.face.origin;
        let direction = this.face.angle;
        let eyep = new Vec(origin.x + this.max_range * Math.sin(direction + this.angle),
                           origin.y + this.max_range * Math.cos(direction + this.angle));
        return new Line(origin.x, origin.y, eyep.x, eyep.y);
    }

    interact(judger) {
        let result = judger(this.line_of_sight);
        this.receive(result);
    }

    receive(result) {
        if(result) {
            this.sensed_proximity = result.up.dist_from(this.face.origin);
            this.sensed_type = result.type;
        } else {
            this.sensed_proximity = this.max_range;
            this.sensed_type = -1;
        }
    }

    signal() {
        // signal in 0 ~ 1, 1 means far away
        let input_array = [1.0, 1.0, 1.0];
        if (this.sensed_type !== -1) {
            // sensed_type is 0 for wall, 1 for food and 2 for poison.
            // lets do a 1-of-k encoding into the input array
            input_array[this.sensed_type] = this.sensed_proximity / this.max_range; // normalize to [0,1]
        }
        return input_array;
    }

    get normalized_distance() {
        return this.sensed_proximity / this.max_range;
    }
    
    draw(ctx) {
        let origin = this.face.origin;
        let direction = this.face.angle;

        var sr = this.sensed_proximity;
        if (this.sensed_type === -1 || this.sensed_type === 0) { 
            ctx.strokeStyle = "rgb(0,0,0)"; // wall or nothing
        }
        if (this.sensed_type === 1) { ctx.strokeStyle = "rgb(255,150,150)"; } // apples
        if (this.sensed_type === 2) { ctx.strokeStyle = "rgb(150,255,150)"; } // poison
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(origin.x + sr * Math.sin(direction + this.angle),
                   origin.y + sr * Math.cos(direction + this.angle));
        ctx.stroke();
    }

}

class MultiEyes {
    constructor(face) {
        this.eyes = [];
        this.face = face;
        this.face = face;
    }

    setup_array(start, step, num) {
        // create eye array
        for (let k = 0; k < num; k++) {
            this.eyes.push(new SingleEye(start + k * step, this.face));
        }
    }

    set face(f) {
        this._face = f;
        for (let i in this.eyes) {
            this.eyes[i].face = this._face; // for consistence..., may use reference later?
        }
    }

    get face() {
        return this._face;
    }

    interact(judger) {
        for (let i in this.eyes) {
            this.eyes[i].interact(judger);
        }
    }

    signal() {
        var input_array = new Array(this.eyes.length * 3);
        for (let i in this.eyes) {
            let sig = this.eyes[i].signal();
            input_array[i * 3] = sig[0];
            input_array[i * 3 + 1] = sig[1];
            input_array[i * 3 + 2] = sig[2];
        }
        return input_array;
    }

    average_distance(sense_type) {
        // return normalized_distance
        let distance = 0.0;
        for (let i in this.eyes) {
            var e = this.eyes[i];
            distance += e.sensed_type === sense_type ? e.normalized_distance : 1.0;
        }
        return distance / this.eyes.length;
    }

    draw(ctx) {
        // draw agents sight
        for (let i in this.eyes) {
            this.eyes[i].draw(ctx);
        }
    }
}

export { MultiEyes };
