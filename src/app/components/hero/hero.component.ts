import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('heroRoot', { static: true }) private readonly heroRoot!: ElementRef<HTMLElement>;
  @ViewChild('modelCanvas', { static: true }) private readonly modelCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('modelGlow', { static: true }) private readonly modelGlow!: ElementRef<HTMLElement>;
  @ViewChild('modelShell', { static: true }) private readonly modelShell!: ElementRef<HTMLElement>;
  @ViewChild('modelStage', { static: true }) private readonly modelStage!: ElementRef<HTMLElement>;

  protected readonly stats = [
    { label: 'Revenue Tracked', value: '₹12Cr+' },
    { label: 'Transactions Processed', value: '2M+' },
    { label: 'Inventory Accuracy', value: '99.8%' },
  ];

  protected showFallback = false;

  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly prefersReducedMotion =
    this.isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private model?: THREE.Object3D;
  private resizeObserver?: ResizeObserver;
  private animationFrameId?: number;
  private entranceTimeline?: gsap.core.Timeline;
  private scrollTimeline?: gsap.core.Timeline;
  private dockTimeline?: gsap.core.Timeline;
  private modelPinTrigger?: ScrollTrigger;
  private floatTween?: gsap.core.Tween;
  private removePointerListener?: () => void;
  private baseModelScale = 1;
  private readonly baseModelPosition = new THREE.Vector3();
  private readonly modelState = {
    idleY: 0,
    rotationX: 0,
    rotationY: -0.42,
    scale: 1,
    y: 0,
  };
  private readonly pointer = new THREE.Vector2();
  private readonly targetPointer = new THREE.Vector2();

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    this.runEntranceAnimations();

    if (!this.hasWebGLSupport()) {
      this.showFallback = true;
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.initThreeScene();
      this.loadModel();
      this.bindPointerParallax();
      this.bindResizeObserver();
      this.animate();
    });
  }

  ngOnDestroy(): void {
    this.entranceTimeline?.kill();
    this.scrollTimeline?.scrollTrigger?.kill();
    this.scrollTimeline?.kill();
    this.dockTimeline?.scrollTrigger?.kill();
    this.dockTimeline?.kill();
    this.modelPinTrigger?.kill();
    this.floatTween?.kill();
    this.removePointerListener?.();
    this.resizeObserver?.disconnect();

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.scene?.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });

    this.renderer?.dispose();
  }

  private runEntranceAnimations(): void {
    const root = this.heroRoot.nativeElement;
    const navbar = document.querySelector('.site-nav');
    const revealTargets = root.querySelectorAll<HTMLElement>('[data-hero-reveal]');
    const statCards = root.querySelectorAll<HTMLElement>('[data-stat-card]');
    const modelShell = root.querySelector<HTMLElement>('[data-model-shell]');

    gsap.set([navbar, revealTargets, statCards, modelShell], {
      autoAlpha: 0,
    });

    if (this.prefersReducedMotion) {
      gsap.set([navbar, revealTargets, statCards, modelShell], {
        autoAlpha: 1,
        clearProps: 'transform',
      });
      return;
    }

    this.entranceTimeline = gsap
      .timeline({ defaults: { ease: 'power3.out' } })
      .fromTo(navbar, { y: -18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.75 })
      .fromTo(
        revealTargets,
        { y: 28, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.85, stagger: 0.1 },
        '-=0.35',
      )
      .fromTo(
        statCards,
        { y: 18, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.65, stagger: 0.09 },
        '-=0.35',
      )
      .fromTo(
        modelShell,
        { scale: 0.9, y: 22, autoAlpha: 0 },
        { scale: 1, y: 0, autoAlpha: 1, duration: 1 },
        '-=0.65',
      );
  }

  private initThreeScene(): void {
    const canvas = this.modelCanvas.nativeElement;
    const { width, height } = canvas.getBoundingClientRect();

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    this.camera.position.set(0, 0.15, 5.2);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.45);
    const hemisphereLight = new THREE.HemisphereLight(0xd9e53f, 0x111111, 0.85);
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(3.2, 4.5, 4.8);

    const rimLight = new THREE.PointLight(0xd9e53f, 9, 11, 1.8);
    rimLight.position.set(-2.8, 1.5, 2.6);

    const backRimLight = new THREE.DirectionalLight(0xd9e53f, 2.2);
    backRimLight.position.set(-3.8, 2.2, -2.4);

    this.scene.add(ambientLight, hemisphereLight, keyLight, rimLight, backRimLight);
  }

  private loadModel(): void {
    const loader = new GLTFLoader();

    loader.load(
      'assets/models/ai-core.glb',
      (gltf) => {
        if (!this.scene) {
          return;
        }

        this.model = gltf.scene;
        this.model.rotation.set(0, 0, 0);
        this.model.position.set(0, 0.28, 0);
        this.fitModelToView(this.model);
        this.model.position.y += this.isMobileViewport() ? 0.12 : 0.34;
        this.baseModelPosition.copy(this.model.position);
        this.baseModelScale = this.model.scale.x;
        this.scene.add(this.model);

        if (!this.prefersReducedMotion) {
          this.initModelScrollAnimation();
          this.floatTween = gsap.to(this.modelState, {
            idleY: 0.035,
            duration: 3.8,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          });
        }
      },
      undefined,
      () => {
        this.ngZone.run(() => {
          this.showFallback = true;
        });
      },
    );
  }

  private fitModelToView(model: THREE.Object3D): void {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2.8 / maxAxis;

    model.scale.setScalar(scale);
    model.position.x -= center.x * scale;
    model.position.y -= center.y * scale;
    model.position.z -= center.z * scale;
  }

  private bindPointerParallax(): void {
    if (this.isMobileViewport()) {
      return;
    }

    const root = this.heroRoot.nativeElement;

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = root.getBoundingClientRect();
      this.targetPointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      this.targetPointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      root.style.setProperty('--mx', `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
      root.style.setProperty('--my', `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
    };

    root.addEventListener('pointermove', handlePointerMove, { passive: true });
    this.removePointerListener = () => root.removeEventListener('pointermove', handlePointerMove);
  }

  private bindResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => this.resizeRenderer());
    this.resizeObserver.observe(this.modelCanvas.nativeElement);
    this.resizeRenderer();
  }

  private resizeRenderer(): void {
    if (!this.renderer || !this.camera) {
      return;
    }

    const canvas = this.modelCanvas.nativeElement;
    const { width, height } = canvas.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.floor(width));
    const nextHeight = Math.max(1, Math.floor(height));

    this.camera.aspect = nextWidth / nextHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(nextWidth, nextHeight, false);
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    if (!this.renderer || !this.scene || !this.camera) {
      return;
    }

    this.pointer.lerp(this.targetPointer, 0.055);

    if (this.model) {
      const parallaxStrength = this.isMobileViewport() || this.prefersReducedMotion ? 0 : 1;
      this.model.rotation.y = this.modelState.rotationY + this.pointer.x * 0.035 * parallaxStrength;
      this.model.rotation.x = this.modelState.rotationX + this.pointer.y * 0.04 * parallaxStrength;
      this.model.rotation.z = this.pointer.x * -0.045;
      this.model.position.x = this.baseModelPosition.x + this.pointer.x * 0.06 * parallaxStrength;
      this.model.position.y = this.baseModelPosition.y + this.modelState.y + this.modelState.idleY;
      this.model.position.z = this.baseModelPosition.z;
      this.model.scale.setScalar(this.baseModelScale * this.modelState.scale);
    }

    this.renderer.render(this.scene, this.camera);
  };

  private hasWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch {
      return false;
    }
  }

  private initModelScrollAnimation(): void {
    const mobile = this.isMobileViewport();
    const rotationY = mobile ? 0.12 : 0.35;
    const rotationX = mobile ? -0.12 : -0.25;
    const y = mobile ? 0.2 : 0.5;
    const scale = mobile ? 1.06 : 1.12;
    const scrollEndTarget = document.querySelector('main') ?? this.heroRoot.nativeElement;

    if (!mobile) {
      this.modelPinTrigger = ScrollTrigger.create({
        trigger: this.heroRoot.nativeElement,
        start: 'top top',
        endTrigger: scrollEndTarget,
        end: 'bottom bottom',
        pin: this.modelShell.nativeElement,
        pinSpacing: false,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      });
    } else {
      this.modelPinTrigger = ScrollTrigger.create({
        trigger: this.modelShell.nativeElement,
        start: 'top center',
        endTrigger: scrollEndTarget,
        end: 'bottom bottom',
        pin: this.modelShell.nativeElement,
        pinSpacing: false,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      });
    }

    this.scrollTimeline = gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: this.heroRoot.nativeElement,
          start: 'top top',
          endTrigger: scrollEndTarget,
          end: mobile ? 'bottom top' : 'bottom bottom',
          scrub: 0.75,
          invalidateOnRefresh: true,
        },
      })
      .to(
        this.modelState,
        {
          rotationY,
          rotationX,
          y,
          scale,
        },
        0,
      )
      .to(
        this.modelGlow.nativeElement,
        {
          '--go': mobile ? 0.96 : 1,
          '--gs': mobile ? 1.05 : 1.12,
        },
        0,
      );

    this.dockTimeline = gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: mobile ? this.modelShell.nativeElement : this.heroRoot.nativeElement,
          start: mobile ? 'top center' : 'top top',
          end: mobile ? '+=260' : 'bottom top',
          scrub: 0.75,
          invalidateOnRefresh: true,
        },
      })
      .to(this.modelStage.nativeElement, {
        x: () => this.getDockOffset().x,
        y: () => this.getDockOffset().y,
        scale: mobile ? 0.42 : 0.62,
        transformOrigin: '100% 100%',
      });
  }

  private isMobileViewport(): boolean {
    return window.matchMedia('(max-width: 900px)').matches;
  }

  private getDockOffset(): { x: number; y: number } {
    const rect = this.modelStage.nativeElement.getBoundingClientRect();
    const margin = this.isMobileViewport() ? 14 : 28;

    return {
      x: window.innerWidth - rect.right - margin,
      y: window.innerHeight - rect.bottom - margin,
    };
  }
}
