<script lang="ts" context="module">
  import { Line2 } from 'three/examples/jsm/lines/Line2.js';
  import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
  import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
  
  export interface ThreeComponent {
    play: () => void;
    pause: () => void;
    reset: () => void;
    setPuckCharge: (charge: number) => void;
    setDecayRate: (rate: number) => void;
    setShowTrace: (show: boolean) => void;
    addBlueCharge: () => void;
    addRedCharge: () => void;
  }
</script>

<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

  let isPlaying = $state(false);
  let stepCount = $state(0);
  let puckCharge = $state(10);
  let decayRate = $state(2);
  let showTrace = $state(true);

  let puckPosition = $state(new THREE.Vector3(0, 0, 0));
  let puckVelocity = $state(new THREE.Vector3(0, 0, 0));
  let puckMesh: THREE.Mesh;
  let tracePoints: THREE.Vector3[] = $state([]);
  let traceLine: Line2 | null = null;
  let traceMaterial: LineMaterial | null = null;
  const mass = 1.0;
  const k = 1.0;
  const minD = 0.1;

  let canvas: HTMLCanvasElement;
  let renderer: THREE.WebGLRenderer;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let controls: OrbitControls;
  const dispatch = createEventDispatcher<{ step: number }>();

  interface Charge { position: THREE.Vector3; type: 'positive' | 'negative'; mesh: THREE.Mesh; }
  let charges: Charge[] = [];
  let arrowHelpers: THREE.Object3D[] = [];
  let streamlineLines: THREE.Object3D[] = [];

  let animationId: number | null = null;
  const timeStep = 0.008;

  let isDragging = false;
  let draggedCharge: Charge | null = null;
  let raycaster = new THREE.Raycaster();
  let mouse = new THREE.Vector2();
  let dragPlane = new THREE.Plane();
  let dragPoint = new THREE.Vector3();
  const dragRange = 5;
  // predefined positions
  const bluePositions = [new THREE.Vector3(3,0,0),new THREE.Vector3(3,0,2),new THREE.Vector3(3,0,-2),
    new THREE.Vector3(3,0,4), new THREE.Vector3(3,0,-4),new THREE.Vector3(5,0,0),];
  const redPositions  = [new THREE.Vector3(-3,0,0),new THREE.Vector3(-3,0,2),new THREE.Vector3(-3,0,-2),
  new THREE.Vector3(-3,0,4), new THREE.Vector3(-3,0,-4),new THREE.Vector3(-5,0,0),];
  let blueIndex = 0;
  let redIndex  = 0;

  function init() {
    renderer = new THREE.WebGLRenderer({canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.set(10, 10, 10);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('dblclick', onDoubleClick);

    createPuck();
    addBlueCharge();
    addRedCharge();
    updateStreamlines();

    controls.update();
    renderer.render(scene,camera);
  }

  function onMouseDown(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(charges.map(c => c.mesh));

    if (intersects.length > 0) {
      isDragging = true;
      draggedCharge = charges.find(c => c.mesh === intersects[0].object) || null;
      if (draggedCharge) {
        dragPlane.setFromNormalAndCoplanarPoint(
          camera.getWorldDirection(dragPlane.normal),
          draggedCharge.position
        );
        controls.enabled = false;
      }
    }
  }

  function onMouseMove(event: MouseEvent) {
    if (!isDragging || !draggedCharge) return;

    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(dragPlane, dragPoint);

    dragPoint.x = Math.max(-dragRange, Math.min(dragRange, dragPoint.x));
    dragPoint.y = Math.max(-dragRange, Math.min(dragRange, dragPoint.y));
    dragPoint.z = Math.max(-dragRange, Math.min(dragRange, dragPoint.z));

    draggedCharge.position.copy(dragPoint);
    draggedCharge.mesh.position.copy(dragPoint);
    updateStreamlines();
  }

  function onMouseUp() {
    isDragging = false;
    draggedCharge = null;
    controls.enabled = true;
  }

  function onDoubleClick(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(charges.map(c => c.mesh));

    if (intersects.length > 0) {
      const chargeToDelete = charges.find(c => c.mesh === intersects[0].object);
      if (chargeToDelete) {
        scene.remove(chargeToDelete.mesh);
        charges = charges.filter(c => c !== chargeToDelete);
        updateStreamlines();
      }
    }
  }

  function animate() {
    if(isPlaying){
      step();
    }
    controls.update();
    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
  }

  function createPuck() {
    const geom = new THREE.SphereGeometry(0.1, 16, 16);
    const mat  = new THREE.MeshBasicMaterial({ color: 0x000000 });
    puckMesh = new THREE.Mesh(geom, mat);
    puckPosition = new THREE.Vector3(0, Math.random() * 2 - 1, 0);
    puckMesh.position.copy(puckPosition);
    scene.add(puckMesh);
  }

  function computeFieldAt(pt: THREE.Vector3): THREE.Vector3 {
    const E = new THREE.Vector3();
    for (const c of charges) {
      const rVec = pt.clone().sub(c.position);
      const r = rVec.length();
      const dir = rVec.normalize();
      const R = Math.max(r, minD);
      const sign = (c.type === 'positive' ? 1 : -1);
      const mag = sign*k/(R*R)
      E.addScaledVector(dir, mag);
    }
    return E;
  }

  function sampleSphereDirections(n: number): THREE.Vector3[] {
    const dirs: THREE.Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const phi   = Math.acos(1 - 2 * (i + 0.5) / n);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      dirs.push(new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      ));
    }
    return dirs;
  }

  function addArrowMesh(pos: THREE.Vector3, dir: THREE.Vector3) {
    const shaftLen = 0.2;
    const headLen = 0.1;
    const shaftRad = 0.02;
    const headRad = 0.06;
    const fieldStrength = computeFieldAt(pos).length();
    const normalizedStrength = Math.min(fieldStrength / 10, 1);
    const contrastStrength = Math.pow(normalizedStrength, 0.5);
    const color = new THREE.Color(
      0.1 + contrastStrength * 0.9, 
      0.1 + contrastStrength * 0.9,
      0.1 + contrastStrength * 0.9
    );
    const mat = new THREE.MeshBasicMaterial({ color });
    const shaftGeo = new THREE.CylinderGeometry(shaftRad, shaftRad, shaftLen, 8);
    const shaft = new THREE.Mesh(shaftGeo, mat);
    shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir);
    shaft.position.copy(pos.clone().add(dir.clone().multiplyScalar(shaftLen/2)));
    scene.add(shaft);
    arrowHelpers.push(shaft);
    const headGeo = new THREE.ConeGeometry(headRad, headLen, 8);
    const head = new THREE.Mesh(headGeo, mat);
    head.quaternion.copy(shaft.quaternion);
    head.position.copy(pos.clone().add(dir.clone().multiplyScalar(shaftLen + headLen/2)));
    scene.add(head);
    arrowHelpers.push(head);
  }

  function updateStreamlines() {
    arrowHelpers.forEach(o => scene.remove(o)); arrowHelpers = [];
    streamlineLines.forEach(l => scene.remove(l)); streamlineLines = [];

    const seedsPerCharge = 12;
    const stepSize = 0.22;
    const maxSteps = 200;

    for (const ch of charges.filter(c => c.type === 'positive')) {
      const seeds = sampleSphereDirections(seedsPerCharge);
      for (const dir0 of seeds) {
        let pos = ch.position.clone().add(dir0.clone().multiplyScalar(0.3 + 0.05));
        const points: THREE.Vector3[] = [ pos.clone() ];

        for (let i = 0; i < maxSteps; i++) {
          const E = computeFieldAt(pos);
          if (E.length() < 1e-3) break;
          const d = E.normalize().multiplyScalar(stepSize);
          pos = pos.clone().add(d);
          points.push(pos.clone());

          if (charges.some(c => c.type === 'negative' && pos.distanceTo(c.position) < 0.3)) break;
        }

        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color: 0x333333 });
        const line = new THREE.Line(geo, mat);
        scene.add(line);
        streamlineLines.push(line);

        for (let k = 3; k < points.length; k += 6) {
          const p0 = points[k-1]; const p1 = points[k];
          addArrowMesh(p0, p1.clone().sub(p0).normalize());
        }
      }
    }
  }

  function updateTraceLine() {
    if(!showTrace || tracePoints.length<2){
      if (traceLine) {
        scene.remove(traceLine);
        traceLine.geometry.dispose();
        traceLine = null;
      }
      return;
    }
    const positions = tracePoints.flatMap(p => [p.x, p.y, p.z]);
    const geometry = new LineGeometry();
    geometry.setPositions(positions);
    
    if(!traceMaterial){
      traceMaterial = new LineMaterial({
        color: 0x00ff00,
        linewidth: 3,
        dashed: false,
        opacity: 1.0,
        transparent: false
      });
    }
    traceMaterial.depthTest = false;
    traceMaterial.depthWrite = false;
    traceMaterial.resolution.set(canvas.clientWidth, canvas.clientHeight);
    
    if(traceLine){
      scene.remove(traceLine);
      traceLine.geometry.dispose();
    }
    traceLine = new Line2(geometry, traceMaterial);
    traceLine.renderOrder = 999;
    scene.add(traceLine);
  }

  function step() {
    const E = computeFieldAt(puckPosition);
    const force = E.multiplyScalar(puckCharge);
    const acceleration = force.divideScalar(mass);
    puckVelocity.addScaledVector(acceleration,timeStep);
    puckVelocity.multiplyScalar(Math.max(0,1-decayRate*timeStep));
    puckPosition.addScaledVector(puckVelocity, timeStep);
    puckMesh.position.copy(puckPosition);
    stepCount++;
    if (stepCount % 5 === 0) {
      dispatch('step', stepCount);
    }
    if (showTrace) {
      tracePoints.push(puckPosition.clone());
      if (tracePoints.length > 5000) {
        tracePoints.shift();
      }
      updateTraceLine();
    }
  }
  export function play() {
    isPlaying = true;
    if (!animationId) {
      if (showTrace) {
        const initialPoint = puckMesh.position.clone();
        tracePoints = [initialPoint];
        updateTraceLine();
      }
      animate();
    }
  }

  export function pause() {
    isPlaying = false;
  }

  export function reset() {
    isPlaying = false;
    if (animationId!= null) cancelAnimationFrame(animationId);
    charges.forEach(c => scene.remove(c.mesh));
    charges = [];
    blueIndex = 0;
    redIndex  = 0;
    addBlueCharge();
    addRedCharge();

    tracePoints = [];
    if (traceLine) {
      scene.remove(traceLine);
      traceLine = null;
    }
    puckVelocity.set(0, 0, 0);
    puckPosition.set(0, Math.random() * 2 - 1, 0);
    puckMesh.position.copy(puckPosition);
    stepCount = 0;
    dispatch('step', stepCount);
    resetView();
    updateStreamlines();
    controls.update();
    renderer.render(scene, camera);
    animate();
  }

  export function setPuckCharge(charge: number) {
    puckCharge = charge;
  }

  export function setDecayRate(rate: number) {
    decayRate = rate;
  }

  export function setShowTrace(show: boolean) {
    showTrace = show;
    if (show) {
      const initialPoint = puckMesh.position.clone();
      tracePoints = [initialPoint];
      updateTraceLine();
    } else {
      if (traceLine) {
        scene.remove(traceLine);
        traceLine = null;
      }
    }
  }

  export function addBlueCharge() {
    if (blueIndex >= bluePositions.length) return;
    const pos = bluePositions[blueIndex++];
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.2,16,16), 
      new THREE.MeshBasicMaterial({ color: 0x0000ff })
    );
    mesh.position.copy(pos);
    scene.add(mesh);
    charges.push({ position: pos.clone(), type: 'positive', mesh });
    updateStreamlines();
  }

  export function addRedCharge() {
    if (redIndex >= redPositions.length) return;
    const pos = redPositions[redIndex++];
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2,16,16), mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    charges.push({ position: pos.clone(), type: 'negative', mesh });
    updateStreamlines();
  }


  function resetView(){
    camera.fov=60;
    camera.position.set(10,10,10);
    camera.updateProjectionMatrix();
    controls.update();
    renderer.render(scene,camera);
  }

  onMount(() => {
    init();
    animate();
    window.addEventListener('resize', () => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    });
  });

  onDestroy(() => {
    if (animationId) cancelAnimationFrame(animationId);
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('dblclick', onDoubleClick);
  });
</script>

<canvas bind:this={canvas}></canvas>

<style>
  canvas { width: 100%; height: 100%; display: block; }
</style>
