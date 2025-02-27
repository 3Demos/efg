<script>
	import { norm } from '$lib/mathutils';
	import { arrow } from './SVGSnippets.svelte';

	let puck = $state({
		x: 0,
		y: 0
	});

	$inspect(puck);
	/**
	 * @type SVGElement
	 */
	let svg;

	/**
	 * @type SVGElement
	 */
	let puckElement;

	/**
	 *
	 * @param {MouseEvent} e
	 */
	function onMouseDown(e) {
		onMouseMove(e);
		svg?.addEventListener('mousemove', onMouseMove);
	}

	/**
	 *
	 * @param {MouseEvent} e
	 */
	function onMouseUp(e) {
		svg?.removeEventListener('mousemove', onMouseMove);
	}

	/**
	 *
	 * @param {MouseEvent} e
	 */
	function onMouseMove(e) {
		console.log(e.clientY, e.offsetY, svg.clientHeight);
		puck.x = (e.offsetX / svg.clientWidth - 0.5) * 300;
		puck.y = (e.offsetY / svg.clientHeight - 0.5) * 200;
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<svg
	bind:this={svg}
	xmlns="http://www.w3.org/2000/svg"
	width="600"
	height="400"
	viewBox="-150 -100 300 200"
	onmouseup={onMouseUp}
>
	<!-- A rectangle inside the coordinate range -->
	<circle cx="0" cy="0" r="10" fill="pink" />
	<circle cx={puck.x} cy={puck.y} r="10" fill="blue" onmousedown={onMouseDown} />
	{#if norm(puck.x, puck.y) > 0}
		{@render arrow(
			puck.x,
			puck.y,
			-(20 * puck.x) / norm(puck.x, puck.y),
			-(20 * puck.y) / norm(puck.x, puck.y),
			20 / norm(puck.x, puck.y)
		)}
	{/if}
</svg>

<style>
	svg {
		border: 1px solid black;
	}
</style>
