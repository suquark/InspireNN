import { VisElement } from 'visualize/basicvis.js';

/**
 * GraphPlot3D
 */
class GraphPlot3D extends VisElement {
    
    constructor(s, init_z_pos=400) {
        super();
        this.s = this.make_selector(s);
        this.inner1 = this.s.append("div");
        this.inner2 = this.inner1.append("div");
        var inner_dom = this.inner2._groups[0][0];  //[0][0];

        this.points = [];
        this.lines = [];

        this.mouse = new THREE.Vector2(-1, -1);
        this.INTERSECTED = null;

        this.point_event_funcs = {}

        //ThreeJS stuff
        this.camera = new THREE.PerspectiveCamera(60, 1.0/1.0, 0.01, 8000);
        this.camera.position.set(init_z_pos, 0, 0);
        this.controls = new THREE.TrackballControls(this.camera, inner_dom);
        this.scene = new THREE.Scene();
        this.projector = new THREE.Projector();
        this.raycaster = new THREE.Raycaster();
        this.renderer = new THREE.WebGLRenderer();
        inner_dom.appendChild(this.renderer.domElement);

        this.make_materials();

        this.inner1.on("mousemove", () => {
            var W = parseInt(this.s.style('width'));
            var H = parseInt(this.s.style('height'));
            var X = d3.event.offsetX || d3.event.layerX || 0;
            var Y = d3.event.offsetY || d3.event.layerY || 0;
            this.mouse.x =  2 * X / W - 1;
            this.mouse.y = -2 * Y / H + 1;
        });
    }



    make_materials() {

        this.materials = { points: {}, selected_points: {}, lines: {} };

        this.point_classes = [];

        var material = new THREE.MeshLambertMaterial({ color: 0x777777 });
        this.materials.points["default"] = material;

        var material = new THREE.MeshLambertMaterial({ color: 0x999999 });
        this.materials.selected_points["default"] = material;

        var material = new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 1.8 });
        this.materials.lines["default"] = material;

        for (var i = 0; i < 10; i++) {
            var color = d3.hsl(360 * i / 10.0, 0.5, 0.5).toString();
            var material = new THREE.MeshLambertMaterial({ color: color });
            this.materials.points[i] = material;

            var color = d3.hsl(360 * i / 10.0, 0.8, 0.8).toString();
            var material = new THREE.MeshLambertMaterial({ color: color });
            this.materials.selected_points[i] = material;

            var color = d3.hsl(360 * i / 10.0, 0.4, 0.4).toString();
            var material = new THREE.LineBasicMaterial({ color: color, linewidth: 1.8 });
            this.materials.lines[i] = material;

        }
    }

    layout() {
        var W = parseInt(this.s.style('width'));
        var H = parseInt(this.s.style('height'));
        H = W * 0.6;
        this.s.style('height', H);
        this.camera.aspect = W / H;
        this.camera.updateProjectionMatrix();
        this.renderer.setClearColor('#FFFFFF');
        this.renderer.setSize(W, H);
        this.renderer.sortObjects = false;
        this.controls.handleResize();
        this.camera.position.z = 70;
        this._render();

        var light = new THREE.DirectionalLight(0xffffff, 2);
        light.position.set(80, 0, 0).normalize();
        this.scene.add(light);

        var light = new THREE.DirectionalLight(0xffffff);
        light.position.set(0, 0, 0).normalize();
        this.scene.add(light);

        var light = new THREE.DirectionalLight(0xffffff);
        light.position.set(-60, 40, 0).normalize();
        this.scene.add(light);

        var light = new THREE.DirectionalLight(0xffffff);
        light.position.set(-40, -40, 50).normalize();
        this.scene.add(light);

        var light = new THREE.DirectionalLight(0xffffff);
        light.position.set(-40, 0, -50).normalize();
        this.scene.add(light);

    }

    make_points(n) {
        var geometry = new THREE.SphereGeometry(3, 15, 15); 
        for (var i = 0; i < n; i++) {
            var k = this.point_classes[i];
            k = k != undefined ? k : "default";
            var object = new THREE.Mesh(geometry, this.materials.points[k]);
            object.i = i;
            object.normal_material = this.materials.points[k];
            object.selected_material = this.materials.selected_points[k];
            this.scene.add(object);
            this.points.push(object);
        }
    }

    make_edges(edges) {
        for (var n in edges) {
            var edge = edges[n];
            var i = edge[0], j = edge[1];
            var yi = this.point_classes[i];
            var yj = this.point_classes[j];

            yi = yi != undefined ? yi : "default";
            yj = yj != undefined ? yj : "default";

            var material_ind = (yi == yj) ? yi : "default";
            var material = this.materials.lines[material_ind];

            var geometry = new THREE.Geometry();
            geometry.dynamic = true;
            geometry.vertices.push(new THREE.Vector3(0, 0, 0));
            geometry.vertices.push(new THREE.Vector3(0, 0, 0));

            var line = new THREE.Line(geometry, material);
            line.i = i; line.j = j;
            line.is_point = false;
            this.scene.add(line);
            this.lines.push(line);
        }
    }

    _animate() {
        this.controls.update();
        requestAnimationFrame(() => { this._animate(); });
        this._render();
    }

    _render() {

        var mouse3 = new THREE.Vector3(this.mouse.x, this.mouse.y, 1);
        var cam_pos = this.camera.position;
        this.projector.unprojectVector(mouse3, this.camera);
        this.raycaster.set(cam_pos, mouse3.sub(cam_pos).normalize());
        var intersects = this.raycaster.intersectObjects(this.points);

        var new_intersected = (intersects.length > 0) ?
            intersects[0].object : null;

        if (this.INTERSECTED != new_intersected) {
            if (this.INTERSECTED != null) {
                if (this.point_event_funcs["mouseout"])
                    this.point_event_funcs["mouseout"](this.INTERSECTED.i)
                this.INTERSECTED.material = this.INTERSECTED.normal_material;
            }
            this.INTERSECTED = new_intersected;
            if (this.INTERSECTED != null) {
                if (this.point_event_funcs["mouseover"])
                    this.point_event_funcs["mouseover"](this.INTERSECTED.i)
                this.INTERSECTED.material = this.INTERSECTED.selected_material;
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    set position(pos) {
        let K = 7;
        for (let n = 0; n < this.points.length; n++) {
            this.points[n].position.x = pos[n][0] * K;
            this.points[n].position.y = pos[n][1] * K;
            this.points[n].position.z = pos[n][2] * K;
        }
        for (let n = 0; n < this.lines.length; n++) {
            let line = this.lines[n];
            let i = line.i, j = line.j;
            line.geometry.vertices[0].set(K * pos[i][0], K * pos[i][1], K * pos[i][2]);
            line.geometry.vertices[1].set(K * pos[j][0], K * pos[j][1], K * pos[j][2]);
            line.geometry.verticesNeedUpdate = true;
        }
    }
}

export { GraphPlot3D };
