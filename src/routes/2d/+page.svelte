<script lang="ts">
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
			const r = Math.hypot(u - p.x, v - p.y);
			if (r == 0) {
				return [Infinity, Infinity];
			} else {
				vec[0] += (p.charge * (u - p.x)) / Math.pow(r, 3);
				vec[1] += (p.charge * (v - p.y)) / Math.pow(r, 3);
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
			200 * Math.hypot(vx, vy),
		)}
	{/each}

	{#each particles as particle}
		<circle
			cx={particle.x}
			cy={particle.y}
			r="5"
			fill={particle.charge > 0 ? 'blue' : 'red'}
			onmousedown={(e) => onMouseDown(e, particle)}
		/>
	{/each}
</svg>

<style>
	svg {
		border: 1px solid black;
	}
</style>
