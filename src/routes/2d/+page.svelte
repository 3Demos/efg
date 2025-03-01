<script lang="ts">
	import { norm } from '$lib/mathutils';
	import { arrow } from './SVGSnippets.svelte';

	let proton = $state({
		x: 0,
		y: 0
	});

	$inspect(proton);

	let svg: SVGElement;

	function onMouseDown(e: MouseEvent) {
		onMouseMove(e);
		svg?.addEventListener('mousemove', onMouseMove);
	}

	function onMouseUp(e: MouseEvent) {
		svg?.removeEventListener('mousemove', onMouseMove);
	}

	function onMouseMove(e: MouseEvent) {
		console.log(e.clientY, e.offsetY, svg.clientHeight);
		proton.x = (e.offsetX / svg.clientWidth - 0.5) * 300;
		proton.y = (e.offsetY / svg.clientHeight - 0.5) * 200;
	}

	// Field dimensions
	const WIDTH = 300;
	const HEIGHT = 200;
	const STEP = 15;

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
	onmouseup={onMouseUp}
>
	{#each vfCoords as [x, y]}
		{@render arrow(
			x,
			y,
			(10 * (x - proton.x)) / norm(x - proton.x, y - proton.y),
			(10 * (y - proton.y)) / norm(x - proton.x, y - proton.y),
			200 / Math.pow(norm(x - proton.x, y - proton.y), 2)
		)}
	{/each}

	<circle cx={proton.x} cy={proton.y} r="5" fill="blue" onmousedown={onMouseDown} />
</svg>

<style>
	svg {
		border: 1px solid black;
	}
</style>
