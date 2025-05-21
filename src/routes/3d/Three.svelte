<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

  export let decayRate: number = 2;
  export let puckCharge: number = 10;
  export let showTrace: boolean = false;

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
  let puckMesh: THREE.Mesh;
  let puckVelocity = new THREE.Vector3();
  let tracePoints: THREE.Vector3[] = [];
  let traceLine: THREE.Line | null = null;

  let isPlaying = false;
  let animationId: number | null = null;
  let stepCount = 0;
  const timeStep = 0.016;

  // Predefined positions
  const bluePositions = [new THREE.Vector3(3,0,0),new THREE.Vector3(3,0,2),new THREE.Vector3(3,0,-2),
    new THREE.Vector3(3,0,4), new THREE.Vector3(3,0,-4),new THREE.Vector3(5,0,0),
  ];
  const redPositions  = [new THREE.Vector3(-3,0,0),new THREE.Vector3(-3,0,2),new THREE.Vector3(-3,0,-2),
  new THREE.Vector3(-3,0,4), 
  new THREE.Vector3(-3,0,-4),
  new THREE.Vector3(-5,0,0),
  ];
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

    createPuck();
    addBlueCharge();
    addRedCharge();
    updateStreamlines();

    controls.update();
    renderer.render(scene,camera);
  }

  function animate() {
    if(isPlaying){
      step();
    }
    controls.update();
    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
  }
//puck mesh creation
  function createPuck() {
    const geom = new THREE.SphereGeometry(0.1, 16, 16);
    const mat  = new THREE.MeshBasicMaterial({ color: 0x000000 });
    puckMesh = new THREE.Mesh(geom, mat);
    puckMesh.position.set(0, 0.1, 0);
    scene.add(puckMesh);
  }
 //compute electric field vector at a random point
  function computeFieldAt(pt: THREE.Vector3) {
    const E = new THREE.Vector3();
    for (const ch of charges) {
      const rVec = pt.clone().sub(ch.position);
      const r = rVec.length();
      if (r < 0.2) continue;
      const mod = r < 2 ? Math.pow(r / 2, 2) : 1;
      const magnitude = (10 * (ch.type === 'positive' ? 1 : -1)) / Math.pow(r, decayRate + 1);
      E.add(rVec.normalize().multiplyScalar(magnitude * mod));
    }
    return E;
  }

  // generate directions on a sphere
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

  // Add a small arrow mesh at pos in direction dir
  function addArrowMesh(pos: THREE.Vector3, dir: THREE.Vector3) {
    const shaftLen = 0.2;
    const headLen = 0.1;
    const shaftRad = 0.02;
    const headRad = 0.06;
    const mat = new THREE.MeshBasicMaterial({ color: 0x000000 });

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

  // update streamline emanating from positive charges
  function updateStreamlines() {
    // clear old
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

          // stop near negative charges
          if (charges.some(c => c.type === 'negative' && pos.distanceTo(c.position) < 0.3)) break;
        }

        // draw line
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color: 0x333333 });
        const line = new THREE.Line(geo, mat);
        scene.add(line);
        streamlineLines.push(line);

        // arrows along line
        for (let k = 3; k < points.length; k += 6) {
          const p0 = points[k-1]; const p1 = points[k];
          addArrowMesh(p0, p1.clone().sub(p0).normalize());
        }
      }
    }
  }

  function step() {
    const force = computeFieldAt(puckMesh.position).multiplyScalar(puckCharge);
    puckVelocity.add(force.multiplyScalar(timeStep));
    puckVelocity.multiplyScalar(1 - decayRate * timeStep);
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
    tracePoints.push(puckMesh.position.clone());
    const geom = new THREE.BufferGeometry().setFromPoints(tracePoints);
    const mat  = new THREE.LineBasicMaterial({ color: 0x000000 });
    traceLine = new THREE.Line(geom, mat);
    scene.add(traceLine);
  }

  export function play() {
    if (!isPlaying) {
      isPlaying = true;
      animate();
    }
  }

  export function resetSim() {
    isPlaying = false;
    if (animationId) cancelAnimationFrame(animationId);
    charges.forEach(c => {
      if (!c.position.equals(bluePositions[0]) && !c.position.equals(redPositions[0])) {
        scene.remove(c.mesh);
      }
    });
    charges = charges.filter(c => 
      c.position.equals(bluePositions[0]) || 
      c.position.equals(redPositions[0])
    );

    tracePoints = [];
    if (traceLine){
      scene.remove(traceLine);
      traceLine=null;
    }
    puckVelocity.set(0,0,0);
    puckMesh.position.set(0,0.1,0);
    stepCount = 0;
    dispatch('step',stepCount);
    blueIndex = 1;
    redIndex = 1;
    controls.update();
    renderer.render(scene,camera);
    updateStreamlines();
    resetView();
  }

  export function addBlueCharge() {
    if (blueIndex >= bluePositions.length) return;
    const pos = bluePositions[blueIndex++];
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.2,16,16), new THREE.MeshBasicMaterial({ color: 0x0000ff })
    );
    mesh.position.copy(pos);
    scene.add(mesh);
    charges.push({ position: pos.clone(), type: 'positive', mesh });
    updateStreamlines();
  }

  export function addRedCharge() {
    if (redIndex >= redPositions.length) return;
    const pos = redPositions[redIndex++];
    const mat =new THREE.MeshBasicMaterial({
      color:0xff0000,
      transparent:true
    });

    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2,16,16),mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    charges.push({ position: pos.clone(), type: 'negative', mesh });
    updateStreamlines();
  }
  export function zoomIn(){
    if(camera instanceof THREE.PerspectiveCamera){
      camera.fov /=1.2;
      camera.updateProjectionMatrix();
      controls.update();
      renderer.render(scene,camera);
    }
  }
  export function zoomOut(){
    if(camera instanceof THREE.PerspectiveCamera){
      camera.fov *=1.2;
      camera.updateProjectionMatrix();
      controls.update();
      renderer.render(scene,camera);
    }
  }
  export function resetView(){
    camera.fov=60;
    camera.position.set(10,10,10);
    camera.updateProjectionMatrix();
    controls.update();
    renderer.render(scene,camera);
  }

  onMount(() => {
    init();
    animationId=requestAnimationFrame(function renderLoop(){
      controls.update();
      renderer.render(scene,camera);
      animationId=requestAnimationFrame(renderLoop)
    });
    window.addEventListener('resize', () => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    });
  });

  onDestroy(() => {
    if (animationId) cancelAnimationFrame(animationId);
  });
</script>

<canvas bind:this={canvas}></canvas>

<style>
  canvas { width: 100%; height: 100%; display: block; }
</style>
