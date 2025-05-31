<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

  export let decayRate: number = 2;
  export let puckCharge: number = 10;
  export let showTrace: boolean = false;
  export let chargeType: 'positive' | 'negative' = 'positive';

  let canvas: HTMLCanvasElement;
  let renderer: THREE.WebGLRenderer;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let controls: OrbitControls;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  interface Charge { position: THREE.Vector3; type: 'positive' | 'negative'; mesh: THREE.Mesh; }
  let charges: Charge[] = [];
  let arrowHelpers: THREE.ArrowHelper[] = [];


  let puckMesh: THREE.Mesh;
  let puckVelocity = new THREE.Vector3();
  let tracePoints: THREE.Vector3[] = [];
  let traceLine: THREE.Line | null = null;

  let animationId: number | null = null;
  let stepCount = 0;
  const timeStep = 0.016;

  const dispatch = createEventDispatcher<{ step: number }>();

  function animate() {
    controls.update();
    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
  }

  function init() {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Create puck
    createPuck();
    updateField();

    animate();
  }

  function createPuck() {
    const geom = new THREE.SphereGeometry(0.1, 16, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    puckMesh = new THREE.Mesh(geom, mat);
    puckMesh.position.set(0, 0.1, 0);
    scene.add(puckMesh);
  }

  function computeFieldAt(point: THREE.Vector3) {
    const e = new THREE.Vector3();
    charges.forEach(ch => {
      const r = point.clone().sub(ch.position);
      const r2 = r.lengthSq();
      if (r2 <0.01) return;
      const fieldStrength = 3.0;
      const magnitude = (ch.type === 'positive' ? 1 : -1) / r2 * fieldStrength;
      e.add(r.normalize().multiplyScalar(magnitude));
    });
    return e;
  }

  function updateField() {
    arrowHelpers.forEach(o => scene.remove(o));
    arrowHelpers = [];
    const electronRadius = 0.2; 
    const gap = 0.2; 
    const startOffset = electronRadius + gap;  
    const numLines = 10; 
    const segments = 30;
    const segmentLenBase = 0.4;

    const shaftRadius  = 0.02; 
    const headRadius = 0.05;  
    const headHeight= 0.15; 
    const initDirs = [
      new THREE.Vector3( 1,  0,  0),
      new THREE.Vector3(-1,  0,  0),
      new THREE.Vector3( 0,  1,  0),
      new THREE.Vector3( 0, -1,  0),
      new THREE.Vector3( 0,  0,  1),
      new THREE.Vector3( 0,  0, -1),
      new THREE.Vector3( 1,  1,  0).normalize(),
      new THREE.Vector3(-1, -1,  0).normalize(),
    ].slice(0, numLines);

    for (const ch of charges) {
      for (const dir0 of initDirs) {
        let pos = ch.position.clone().add(dir0.clone().multiplyScalar(startOffset));

        for (let i = 0; i < segments; i++) {
          const e   = computeFieldAt(pos);
          const mag = e.length();

          const eDir = e.normalize();
          const segmentLen = segmentLenBase;  
          const shaftLen  = segmentLen * 0.7;
          const shaftGeo  = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftLen, 8);
          const shaftMat  = new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0)});
          const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
          shaftMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), eDir);
          shaftMesh.position.copy(pos.clone().add(eDir.clone().multiplyScalar(shaftLen / 2)));
          scene.add(shaftMesh);

          const headGeo  = new THREE.ConeGeometry(headRadius, headHeight, 8);
          const headMat  = shaftMat;
          const headMesh = new THREE.Mesh(headGeo, headMat);
          headMesh.quaternion.copy(shaftMesh.quaternion);
          headMesh.position.copy(pos.clone().add(eDir.clone().multiplyScalar(shaftLen + headHeight / 2)));
          scene.add(headMesh);

          pos.add(eDir.clone().multiplyScalar(segmentLen));
        }
      }
    }
  }
  function step() {
    // Compute force on puck
    const force = computeFieldAt(puckMesh.position).multiplyScalar(puckCharge);
    puckVelocity.add(force.multiplyScalar(timeStep));
    puckVelocity.multiplyScalar(1 - decayRate * timeStep);
    // Update position
    puckMesh.position.add(puckVelocity.clone().multiplyScalar(timeStep));

    stepCount++;
    dispatch('step', stepCount);

    if (showTrace) {
      tracePoints.push(puckMesh.position.clone());
      updateTraceLine();
    }
  }

  function updateTraceLine() {
    if (traceLine) scene.remove(traceLine);
    const geom = new THREE.BufferGeometry().setFromPoints(tracePoints);
    const mat = new THREE.LineBasicMaterial({ color: 0x000000 });
    traceLine = new THREE.Line(geom, mat);
    scene.add(traceLine);
  }

  export function play() {
    //TODO
  }

  export function resetSim() {
    //TODO
    updateField();
  }

  export function zoomIn() { camera.zoom *= 1.2; camera.updateProjectionMatrix(); }
  export function zoomOut() { camera.zoom /= 1.2; camera.updateProjectionMatrix(); }
  export function resetView() {
    camera.position.set(0, 5, 10);
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    controls.update();
  }
  $: {
    if (charges.length) {
      updateField();

    }
  }

  function onPointerDown(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const pt = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, pt);
    const geom = new THREE.SphereGeometry(0.2, 16, 16);
    const color = chargeType === 'positive' ? 0x0000ff : 0xff0000;
    const mat = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(pt).setY(0.1);
    scene.add(mesh);
    charges.push({ position: mesh.position.clone(), type: chargeType, mesh });
    updateField();

  }
  

  onMount(() => {
    init();
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('resize', () => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    });
    
  });

  onDestroy(() => {
    if (animationId) cancelAnimationFrame(animationId);
    canvas.removeEventListener('pointerdown', onPointerDown);
  });
</script>

<canvas bind:this={canvas}></canvas>

<style>
  canvas { width: 100%; height: 100%; display: block; }
</style>

