<script module>
	import { norm } from '$lib/mathutils';
	export { arrow };

	const INVSQRT2 = 1 / Math.sqrt(2);
</script>

{#snippet arrow(x, y, dx, dy, alpha = 1, arrowHeadSize = 4)}
	{#if norm(dx, dy) > 0}
		<path
			d={`          M${x},${y} 
  L${x + dx},${y + dy} 
  M${x + dx},${y + dy} 
  L${x + dx - (arrowHeadSize * (dx * INVSQRT2 - dy * INVSQRT2)) / norm(dx, dy)},${y + dy - (arrowHeadSize * (dx * INVSQRT2 + dy * INVSQRT2)) / norm(dx, dy)} 
  M${x + dx},${y + dy} 
  L${x + dx - (arrowHeadSize * (dx * INVSQRT2 + dy * INVSQRT2)) / norm(dx, dy)},${y + dy - (arrowHeadSize * (-dx * INVSQRT2 + dy * INVSQRT2)) / norm(dx, dy)}
  `}
			stroke="black"
			stroke-width="1"
			fill="none"
			opacity={alpha}
		/>
	{/if}
{/snippet}
