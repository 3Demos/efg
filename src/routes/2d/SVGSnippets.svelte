<script module lang="ts">
	export { arrow };

	const INVSQRT2 = 1 / Math.sqrt(2);
</script>

{#snippet arrow(x: number, y: number, dx: number, dy: number, alpha = 1, arrowHeadSize = 2)}
	{#if Math.hypot(dx, dy) > 0}
		<path
			d={`M${x - dx / 2},${y - dy / 2} 
  L${x + dx / 2},${y + dy / 2} 
  M${x + dx / 2},${y + dy / 2} 
  L${x + dx / 2 - (arrowHeadSize * (dx * INVSQRT2 - dy * INVSQRT2)) / Math.hypot(dx, dy)},${y + dy / 2 - (arrowHeadSize * (dx * INVSQRT2 + dy * INVSQRT2)) / Math.hypot(dx, dy)} 
  M${x + dx / 2},${y + dy / 2} 
  L${x + dx / 2 - (arrowHeadSize * (dx * INVSQRT2 + dy * INVSQRT2)) / Math.hypot(dx, dy)},${y + dy / 2 - (arrowHeadSize * (-dx * INVSQRT2 + dy * INVSQRT2)) / Math.hypot(dx, dy)}
  `}
			stroke="black"
			stroke-width="0.5"
			fill="none"
			opacity={alpha}
		/>
	{/if}
{/snippet}


