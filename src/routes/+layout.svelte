<script>
	import '../app.css';
	import { base } from '$app/paths';

	let { children } = $props();
</script>

<nav class="flex items-center justify-between bg-blue-600 p-4">
	<!-- Title on the left -->
	<div class="text-lg font-semibold text-white">Electric Field Goal</div>

	<!-- Navigation links on the right -->
	<div class="space-x-6">
		<a href="{base}/" class="text-white hover:text-gray-300">Home</a>
		<a href="{base}/about" class="text-white hover:text-gray-300">About</a>
		<a href="{base}/2d" class="text-white hover:text-gray-300">2D</a>
		<a href="{base}/3d" class="text-white hover:text-gray-300">3D</a>
	</div>
</nav>

{@render children()}
