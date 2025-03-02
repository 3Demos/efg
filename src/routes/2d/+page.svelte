<script lang="ts">
	import { rk4 } from '$lib/mathutils';
	import { arrow } from './SVGSnippets.svelte';

	interface Particle {
		x: number;
		y: number;
		charge: number;
	}

	let particles: Particle[] = $state([
		{
			x: 0,
			y: 0,
			charge: 1,
		},
		{
			x: 50,
			y: 50,
			charge: -1,
		},
		{
			x: -50,
			y: -70,
			charge: -1,
		},
	]);

	function vf(u: number, v: number) {
		const vec = [0, 0];
		for (const p of particles) {
			const r = Math.max(1, Math.hypot(u - p.x, v - p.y));
			if (r == 0) {
				return [Infinity, Infinity];
			} else {
				vec[0] += (p.charge * (u - p.x)) / Math.pow(r, 2);
				vec[1] += (p.charge * (v - p.y)) / Math.pow(r, 2);
			}
		}
		return vec;
	}

	let svg: SVGElement;

	function onMouseDown(e: MouseEvent, particle: Particle) {
		e.preventDefault();
		console.log('offset:', e.offsetX, e.offsetY, 'client:', e.clientX, e.clientY);

		function onMouseMove(e: MouseEvent) {
			// console.log(e.clientY, e.offsetY, svg.clientHeight, e.target);
			particle.x = (Math.max(0, Math.min(1, e.offsetX / svg.clientWidth)) - 0.5) * WIDTH;
			particle.y = (Math.max(0, Math.min(1, e.offsetY / svg.clientHeight)) - 0.5) * HEIGHT;
		}

		function onMouseUp() {
			document.removeEventListener('mousemove', onMouseMove);
		}

		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
	}

	interface DynParticle extends Particle {
		vx: number;
		vy: number;
	}

	const PUCKX = 50;
	const PUCKY = -50;

	let puck: DynParticle = $state({
		x: PUCKX,
		y: PUCKY,
		charge: 10,
		vx: 0,
		vy: 0,
	});

	let puckTrace = $state([[PUCKX, PUCKY]]);
	let traceString = $derived(
		`M${PUCKX},${PUCKY} ` + puckTrace.map(([x, y]) => `L${x},${y} `).reduce((p = '', c) => p + c),
	);

	// $inspect(puck);

	// Field dimensions
	const WIDTH = 300;
	const HEIGHT = 200;
	const STEP = 10;

	type Point = [number, number];
	const vfCoords: Point[] = [];

	for (let i = 1; i <= WIDTH / STEP; i++) {
		for (let j = 1; j <= HEIGHT / STEP; j++) {
			vfCoords.push([i * STEP - Math.round(WIDTH / 2), j * STEP - Math.round(HEIGHT / 2)]);
		}
	}

	// Playtime

	let go = $state(false);
	let last: number | undefined;
	let req: number | undefined;
	let clock = $state(0);

	function updatePuck(dt: number) {
		const v = rk4(
			([x, y, vx, vy]) => {
				const [ax, ay] = vf(x, y);
				return [vx, vy, 1000 * puck.charge * ax, 1000 * puck.charge * ay];
			},
			[puck.x, puck.y, puck.vx, puck.vy],
			dt,
		);
		puck.x = v[0];
		puck.y = v[1];
		puck.vx = v[2];
		puck.vy = v[3];
		puckTrace.push([v[0], v[1]]);
	}

	function animate(t = 0) {
		if (!go) {
			last = undefined;
			return;
		}
		if (!last) last = t;
		const dt = (t - last) / 1000;
		last = t;
		updatePuck(dt);
		clock += dt;
		req = requestAnimationFrame(animate);
	}

	// Trace path

	let showTrace = $state(false);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<svg
	bind:this={svg}
	xmlns="http://www.w3.org/2000/svg"
	width="600"
	height="400"
	viewBox="{-WIDTH / 2} {-HEIGHT / 2} {WIDTH} {HEIGHT}"
>
	{#each vfCoords.map(([u, v]) => [u, v, ...vf(u, v)]) as [x, y, vx, vy]}
		{@render arrow(
			x,
			y,
			(10 * vx) / Math.hypot(vx, vy),
			(10 * vy) / Math.hypot(vx, vy),
			20 * Math.hypot(vx, vy),
		)}
	{/each}

	{#if showTrace}
		<path
			d={traceString}
			stroke="black"
			stroke-width="1"
			stroke-dasharray="5 2"
			fill="none"
			opacity={1}
		/>
	{/if}

	{#each particles as particle}
		<circle
			cx={particle.x}
			cy={particle.y}
			r="5"
			fill={particle.charge > 0 ? 'blue' : 'red'}
			onmousedown={(e) => onMouseDown(e, particle)}
		/>
	{/each}

	<circle cx={puck.x} cy={puck.y} r="3" fill="black" />
</svg>

<div class="flex w-40 items-center gap-2 p-3">
	<button
		onclick={() => {
			go = !go;
			if (go) req = requestAnimationFrame(animate);
			// } else {
			// 	if (req) cancelAnimationFrame(req);
			// 	last = undefined;
			// }
		}}>{go ? 'Pause' : 'Play'}</button
	>
	<button
		onclick={() => {
			if (req) cancelAnimationFrame(req);
			clock = 0;
			last = undefined;
			go = false;
			puck = { x: 50, y: -50, vx: 0, vy: 0, charge: 10 };
			puckTrace = [[PUCKX, PUCKY]];
		}}>Reset</button
	>
	<span class="p-4 font-mono">{Math.round(1000 * clock) / 1000}</span>
</div>

<div>
	<input class="m-3 p-4" bind:value={puck.charge} type="number" />
	<input type="checkbox" name="trace" id="" bind:checked={showTrace} />
</div>

<style lang="postcss">
	@reference "tailwindcss/theme";

	svg {
		border: 1px solid black;
	}

	button {
		@apply rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-md transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none active:bg-blue-800;
	}
</style>
