<script lang="ts">
    import { T } from '@threlte/core'
    import { OrbitControls } from '@threlte/extras'
    import { leapfrog } from '$lib/mathutils3d.js'
    import { onMount } from 'svelte'
    import { TransformControls } from '@threlte/extras'
    import { MeshStandardMaterial, BoxGeometry, Mesh, Vector3} from 'three'
    import { interactivity } from '@threlte/extras'
    interactivity()


    // CODE FOR SETUP FROM +page.svelte

    let {instructions, resetFunc, addModeFunc} = $props()

    let resetVal = $derived(instructions.reset)

    


    let addMode = $derived(instructions.addMode)


    //$inspect("instructions: " + instructions)


    interface Particle {
        x: number
        y: number
        z: number
        charge: number
    }

    interface DynParticle extends Particle {
        vx: number
        vy: number
        vz: number
    }

    let puck: DynParticle = $state({
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        charge: 1
    })


  
    let particles = $state([
        {x: 0, y: 2, z: 0, charge: -0.001}
    ])


    let puckPosition: [number, number, number] = $derived([puck.x, puck.y, puck.z]);

    //$inspect("puck pos: " + puckPosition)


    let decay = $state(2)
    const RADIUS = 2

    function vf(x: number, y: number, z: number): [number, number, number] {
        const vec = [0, 0, 0]
        for (const p of particles) {
            const dx = x - p.x
            const dy = y - p.y
            const dz = z - p.z
            const r = Math.hypot(dx, dy, dz)
            const factor = r < RADIUS
                ? Math.pow(r / RADIUS, 2) / Math.pow(r, decay + 1)
                : 1 / Math.pow(r, decay + 1)

            vec[0] += 10 * p.charge * dx * factor
            vec[1] += 10 * p.charge * dy * factor
            vec[2] += 10 * p.charge * dz * factor
        }
        return vec as [number, number, number]
    }

    const PUCKX = 0;
	const PUCKY = 0;
    const PUCKZ = 0;

    let puckTrace: [number, number, number][] = $state([[PUCKX, PUCKY, PUCKZ]]);
	let traceString = $derived(
		`M${PUCKX},${PUCKY},${PUCKZ} ` +
			puckTrace.map(([x, y, z]) => `L${x},${y},${z} `).reduce((p = '', c = '') => p + c),
	);

    let go = $derived(instructions.play)
    let last: number | undefined
    let req: number | undefined
    let clock = $state(0)

    function updatePuck(dt: number) {
        let runningTime = 0
        let v = [puck.x, puck.y, puck.z, puck.vx, puck.vy, puck.vz]
        while (runningTime < dt) {
            let h = Math.max(1e-8, dt / Math.max(10, Math.hypot(v[3], v[4], v[5])))
            h = Math.min(h, dt - runningTime)
            runningTime += h

            for (let i = 0; i < 10; i++) {
                v = leapfrog(
                    (x, y, z) => vf(x, y, z).map(c => c * Math.pow(10, decay)),
                    [v[3], v[4], v[5]],
                    [v[0], v[1], v[2]],
                    h
                )
            }
        }
        puck.x = v[0]
        puck.y = v[1]
        puck.z = v[2]
        puck.vx = v[3]
        puck.vy = v[4]
        puck.vz = v[5]
       
        puckTrace.push([v[0], v[1], v[2]])

    }

    function animate(t = 0) {
        if (!go) {
            last = undefined;
            return;
        }
        if (!last) last = t
        const dt = (t - last) / 1000
        last = t
        updatePuck(dt)
        clock += dt;
        req = requestAnimationFrame(animate)
    }

    let showTrace = $state(false)

    // CODE FOR ANIMATION

    $effect(() => {
        
        if (go) {
  
            req = requestAnimationFrame(animate)
        } else if (req) {
            cancelAnimationFrame(req)
            req = undefined
            last = undefined
        }
    })

    $effect(() => {
        if (resetVal) {
            if (req) cancelAnimationFrame(req);
            clock = 0;
            last = undefined;
            go = false;
            // cannot reassign to puck var, must mutate fields
            puck.x = 0;
            puck.y = 0;
            puck.z = 0;
            puck.vx = 0;
            puck.vy = 0;
            puck.vz = 0;


            puckTrace.length = 0;
            resetVal = false;
            resetFunc();
        }
    })

    // CODE FOR ADDING ELECTRON 


    let chargeRef : Mesh | undefined = $state(undefined)

    //$inspect(chargeRef)

    function addParticle([x, y, z] : [number, number, number]) {
        particles.push({x: x, y: y, z: z, charge: -0.001})
    }

    


</script>



<!-- Scene contents -->
<T.PerspectiveCamera makeDefault position={[15, 15, 15]} fov={45}>
    <OrbitControls target={[0, 0, 0]} enableDamping />
</T.PerspectiveCamera>

<T.AmbientLight intensity={0.5} />
<T.DirectionalLight position={[5, 10, 7]} />
<T.AxesHelper args={[5]} />
<T.GridHelper args={[20, 20, 'gray', 'lightgray']} rotation={[0, 0, 0]} />
<T.GridHelper args={[20, 20, 'gray', 'lightgray']} rotation={[Math.PI /2 , 0, 0]} position={[0,10,-10]}/>
<T.GridHelper args={[20, 20, 'gray', 'lightgray']} rotation={[0 , 0, Math.PI/2]} position={[-10,10,0]}/>

<!-- Render particles -->
{#each particles as p}
    <T.Mesh position={[p.x, p.y, p.z]}>
        <T.SphereGeometry args={[0.3, 32, 32]} />
        <T.MeshStandardMaterial color={p.charge > 0 ? 'red' : 'blue'} />
    </T.Mesh>
{/each}

<!-- Render puck -->
<T.Mesh position={puckPosition}>
    <T.SphereGeometry args={[0.25, 32, 32]} />
    <T.MeshStandardMaterial color="black" />
</T.Mesh>


<!--moving charges in 3d space (add mode)-->
{#if addMode}
    
    <!-- charge to be added -->
    <TransformControls>
        <T.Mesh
        bind:ref={chargeRef}
        geometry={new BoxGeometry()}
        material={new MeshStandardMaterial()}
        ondblclick={() => {

            if (chargeRef) {
                const world = new Vector3()
                chargeRef.getWorldPosition(world)
                addParticle([world.x, world.y, world.z])
            }

       

            addModeFunc()
          }}
        />

    </TransformControls>

    




{/if}











