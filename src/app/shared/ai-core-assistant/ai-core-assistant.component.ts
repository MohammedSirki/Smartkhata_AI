import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import gsap from 'gsap';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

@Component({
  selector: 'app-ai-core-assistant',
  templateUrl: './ai-core-assistant.component.html',
  styleUrl: './ai-core-assistant.component.scss',
})
export class AiCoreAssistantComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) private readonly canvas?: ElementRef<HTMLCanvasElement>;

  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private model?: THREE.Object3D;
  private frameId = 0;

  ngAfterViewInit(): void {
    if (!this.isBrowser || !this.canvas) {
      return;
    }

    this.initScene(this.canvas.nativeElement);
    this.animate();

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.from('.ai-core-shell', {
        opacity: 0,
        scale: 0.72,
        y: 24,
        duration: 0.75,
        ease: 'back.out(1.7)',
      });
    }
  }

  ngOnDestroy(): void {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
    }

    this.renderer?.dispose();
  }

  openAssistant(): void {
    void this.router.navigate(['/app/assistant']);
  }

  private initScene(canvas: HTMLCanvasElement): void {
    const size = 180;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    this.camera.position.set(0, 0.2, 4.2);

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(size, size, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const ambient = new THREE.AmbientLight(0xffffff, 1.7);
    const key = new THREE.PointLight(0xd9e53f, 5.5, 8);
    key.position.set(2.2, 2.4, 3.4);
    this.scene.add(ambient, key);

    const loader = new GLTFLoader();
    loader.load(
      'assets/models/ai-core.glb',
      (gltf) => {
        this.model = gltf.scene;
        this.model.scale.setScalar(1.55);
        this.model.position.y = -0.15;
        this.scene?.add(this.model);
      },
      undefined,
      () => this.addFallbackCore(),
    );
  }

  private addFallbackCore(): void {
    if (!this.scene) {
      return;
    }

    const group = new THREE.Group();
    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.08, 2),
      new THREE.MeshStandardMaterial({
        color: 0x151711,
        metalness: 0.72,
        roughness: 0.24,
        emissive: 0x2c3106,
        emissiveIntensity: 0.55,
      }),
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.22, 0.035, 16, 100),
      new THREE.MeshStandardMaterial({ color: 0xd9e53f, emissive: 0xd9e53f, emissiveIntensity: 1.1 }),
    );

    ring.rotation.x = Math.PI / 2.3;
    group.add(shell, ring);
    this.model = group;
    this.scene.add(group);
  }

  private animate(): void {
    this.frameId = requestAnimationFrame(() => this.animate());

    if (this.model) {
      this.model.rotation.y += 0.008;
      this.model.rotation.x = Math.sin(Date.now() * 0.001) * 0.08;
      this.model.position.y = Math.sin(Date.now() * 0.0018) * 0.08;
    }

    if (this.scene && this.camera) {
      this.renderer?.render(this.scene, this.camera);
    }
  }
}
