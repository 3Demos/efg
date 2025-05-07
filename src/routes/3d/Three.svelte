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

  function updateField(){
    arrowHelpers.forEach(a => scene.remove(a));
    arrowHelpers = [];
    let densityFactor =2;

    const gridSize = 15;
    const step = 0.5;
    let maxMag = 0;
    const samples: { pos: THREE.Vector3; dir: THREE.Vector3; mag: number }[] = [];
    // collect power of field
    for (let x = -gridSize; x <= gridSize; x += step/densityFactor) {
      for (let z = -gridSize; z <= gridSize; z += step/densityFactor) {
        const pos = new THREE.Vector3(x, 0.1, z);
        const e = computeFieldAt(pos);
        const mag = e.length();
        if(mag<1e-7) continue;
        samples.push({ pos, dir: e.normalize(), mag });
        maxMag = Math.max(maxMag, mag);
      }
    }
    maxMag = Math.max(maxMag, 0.001);
    //draw arrows
    for (const { pos, dir, mag } of samples) {
        const normalizedMag = mag/maxMag;
        const minBrightness = 0.001;
        const maxBrightness = 0.5;
        const brightness = maxBrightness - (normalizedMag * (maxBrightness - minBrightness));
        const color = new THREE.Color(brightness, brightness, brightness);
        const minLength = 0.2;
        const maxLength = 0.8;
        const len = minLength + normalizedMag * (maxLength - minLength);
      

        const minHeadLength = 0.08;
        const maxHeadLength = 0.18;
        const headLength = minHeadLength + normalizedMag * (maxHeadLength - minHeadLength);
        
        const minHeadWidth = 0.04;
        const maxHeadWidth = 0.10;
        const headWidth = minHeadWidth + normalizedMag * (maxHeadWidth - minHeadWidth);
        const arrow = new THREE.ArrowHelper(dir, pos,len,color.getHex(),headLength,headWidth);
        scene.add(arrow);
        arrowHelpers.push(arrow);
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

