<script>
	import '../app.css';
	let { children } = $props();
</script>

<nav class="flex items-center justify-between bg-blue-600 p-4">
	<!-- Title on the left -->
	<div class="text-lg font-semibold text-white">Electric Field Goal</div>

	<!-- Navigation links on the right -->
	<div class="space-x-6">
		<a href="/" class="text-white hover:text-gray-300">Home</a>
		<a href="#" class="text-white hover:text-gray-300">About</a>
		<a href="/2d" class="text-white hover:text-gray-300">2D</a>
		<a href="/3d" class="text-white hover:text-gray-300">3D</a>
	</div>
</nav>

{@render children()}
