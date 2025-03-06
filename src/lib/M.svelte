<script lang="ts">
	import katex from 'katex';

	const { s, ds = false } = $props();

	let span: HTMLElement;

	$effect(() => {
		katex.render(s, span, {
			displayMode: ds,
			macros: { '\\R': '\\mathbb{R}' },
			throwOnError: false,
			output: 'htmlAndMathml',
		});
	});
</script>

<span bind:this={span}></span>
