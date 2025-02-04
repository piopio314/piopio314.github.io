class FractalRenderer {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
        this.time = 0;

        // Parametry fraktala
        this.maxIterations = 100;
        this.zoom = 1.0;
        this.speed = 1.0;
        this.fractalType = 'mandelbrot';

        this.initShaders();
        this.initScene();
        this.setupEventListeners();
        this.resize();
        this.animate();
    }

    initShaders() {
        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            varying vec2 vUv;
            uniform float time;
            uniform float maxIterations;
            uniform float zoom;
            uniform vec2 center;
            uniform int fractalType;

            vec3 hsv2rgb(vec3 c) {
                vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
            }

            void main() {
                vec2 c;
                if (fractalType == 0) { // Mandelbrot
                    c = (vUv * 4.0 - vec2(2.0)) / zoom;
                    c.x -= 0.5;
                } else { // Julia
                    c = (vUv * 4.0 - vec2(2.0)) / zoom;
                    c = vec2(c.x * 1.5, c.y);
                }

                vec2 z = fractalType == 0 ? c : vUv * 2.0 - vec2(1.0);
                vec2 juliaC = vec2(0.355 + 0.355 * sin(time * 0.1), 0.355 * cos(time * 0.1));

                float i;
                for(i = 0.0; i < maxIterations; i++) {
                    float x = z.x * z.x - z.y * z.y + (fractalType == 0 ? c.x : juliaC.x);
                    float y = 2.0 * z.x * z.y + (fractalType == 0 ? c.y : juliaC.y);

                    if(x*x + y*y > 4.0) break;
                    z = vec2(x, y);
                }

                if(i == maxIterations) {
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                } else {
                    float hue = i / maxIterations;
                    vec3 color = hsv2rgb(vec3(hue + time * 0.1, 1.0, 1.0));
                    gl_FragColor = vec4(color, 1.0);
                }
            }
        `;

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                maxIterations: { value: this.maxIterations },
                zoom: { value: this.zoom },
                center: { value: new THREE.Vector2(0, 0) },
                fractalType: { value: 0 }
            },
            vertexShader,
            fragmentShader
        });
    }

    initScene() {
        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(mesh);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());

        document.getElementById('fractalType').addEventListener('change', (e) => {
            this.fractalType = e.target.value;
            this.material.uniforms.fractalType.value = this.fractalType === 'mandelbrot' ? 0 : 1;
        });

        document.getElementById('iterations').addEventListener('input', (e) => {
            this.maxIterations = parseFloat(e.target.value);
            this.material.uniforms.maxIterations.value = this.maxIterations;
        });

        document.getElementById('zoom').addEventListener('input', (e) => {
            this.zoom = parseFloat(e.target.value);
            this.material.uniforms.zoom.value = this.zoom;
        });

        document.getElementById('speed').addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value);
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.zoom *= e.deltaY > 0 ? 0.95 : 1.05;
            this.zoom = Math.max(0.1, Math.min(this.zoom, 10.0));
            this.material.uniforms.zoom.value = this.zoom;
            document.getElementById('zoom').value = this.zoom;
        });
    }

    resize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.time += 0.01 * this.speed;
        this.material.uniforms.time.value = this.time;
        this.renderer.render(this.scene, this.camera);
    }
}

// Inicjalizacja po załadowaniu strony
window.addEventListener('load', () => new FractalRenderer());