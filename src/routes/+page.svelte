<script lang="ts">
	import M from '$lib/M.svelte';

	let counter = $state(0);
	let N = $state(0);

	let f: number[] = [];
	function factorial(n: number): number {
		if (n == 0 || n == 1) return 1;
		if (f[n] > 0) return f[n];
		return (f[n] = factorial(n - 1) * n);
	}

	function sinExpand(n: number) {
		let out = 'x';
		for (let k = 1; k <= n; k++) {
			out += (k % 2 == 0 ? '+' : '-') + `\\frac{1}{${2 * k + 1}!} x^{${2 * k + 1}}`;
		}
		return out + ` + O(x^{${2 * n + 3}})`;
	}
</script>

<h1>Electric Field Goal</h1>
<p>
	A <strike>rip-off</strike> homage to
	<a
		href="https://phet.colorado.edu/en/simulations/electric-hockey"
		target="_blank"
		rel="noopener noreferrer">Electric Field Hockey</a
	>
</p>

<p>
	<M
		s={`\\vec E = ${counter % 2 == 0 ? '\\oiint' : '\\int'} \\frac{Q^{${counter}}\\hat{\\mathbf r}}{4\\pi\\varepsilon_0 |\\mathbf r|^2} d\\sigma`}
		ds={true}
	/>
</p>

<button onclick={() => counter++}>Click</button>

<p>
	<M s={'\\sin x = ' + sinExpand(N)} ds={true} />
</p>

<input type="range" min="0" max="12" bind:value={N} />
