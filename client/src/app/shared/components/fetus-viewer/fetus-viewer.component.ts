import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import * as THREE from 'three';

// لودر و کنترل‌ها (حتما .js انتها باشه)
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


@Component({
  selector: 'app-fetus-viewer',
  template: `<canvas #canvas3d></canvas>`,
  styles: [`
 canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  `]
})
export class FetusViewerComponent implements OnInit, OnDestroy {
  @ViewChild('canvas3d', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private model!: THREE.Group;
  private animationId: any;

  ngOnInit(): void {
    this.initThree();
    this.loadModel();
    this.animate();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationId);
    this.renderer.dispose();
  }

  initThree() {
    const canvas = this.canvasRef.nativeElement;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 6;

    // Light
    const light = new THREE.PointLight(0xffffff, 1.5);
    light.position.set(10, 10, 10);
    this.scene.add(light);

    const ambient = new THREE.AmbientLight(0x404040, 2);
    this.scene.add(ambient);

    // Resize handler
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  loadModel() {
    const loader = new GLTFLoader();

    // 🔹 مسیر فایل مدل (مثلاً assets/models/fetus.glb)
    loader.load('assets/models/fetus.glb', (gltf) => {
      this.model = gltf.scene;
      this.model.scale.set(2, 2, 2); // سایز مناسب کن
      this.scene.add(this.model);
    }, undefined, (error) => {
      console.error('Error loading model:', error);
    });
  }

  animate = () => {
    this.animationId = requestAnimationFrame(this.animate);

    if (this.model) {
      this.model.rotation.y += 0.005; // چرخش مدل
    }

    this.renderer.render(this.scene, this.camera);
  }
}