<script lang="ts">
	import { rk4, leapfrog } from '$lib/mathutils';
	import { arrow } from './SVGSnippets.svelte';

	interface Particle {
		x: number;
		y: number;
		charge: number;
	}

	let particles: Particle[] = $state([
		{
			x: 60,
			y: -50,
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

	let decay = $state(2);

	const RADIUS = 2;

	function vf(u: number, v: number) {
		const vec = [0, 0];
		for (const p of particles) {
			const r = Math.hypot(u - p.x, v - p.y);
			if (r < RADIUS) {
				console.log('close call', p.x, p.y);
				vec[0] +=
					(Math.pow(r / RADIUS, 2) * (10 * (p.charge * (u - p.x)))) / Math.pow(r, decay + 1);
				vec[1] +=
					(Math.pow(r / RADIUS, 2) * (10 * (p.charge * (v - p.y)))) / Math.pow(r, decay + 1);
			} else {
				vec[0] += (10 * (p.charge * (u - p.x))) / Math.pow(r, decay + 1);
				vec[1] += (10 * (p.charge * (v - p.y))) / Math.pow(r, decay + 1);
			}
		}
		return vec;
	}

	let svg: SVGElement;

	function onMouseDown(e: MouseEvent, particle: Particle) {
		e.preventDefault();

		function onMouseMove(e: MouseEvent) {
			// console.log(e.clientY, e.offsetY, svg.clientHeight, e.target);

			const rect = svg?.getBoundingClientRect();
			particle.x =
				(Math.max(0, Math.min(1, (e.clientX - rect.left) / svg.clientWidth)) - 0.5) * WIDTH;
			particle.y =
				(Math.max(0, Math.min(1, (e.clientY - rect.top) / svg.clientHeight)) - 0.5) * HEIGHT;
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

	const PUCKX = 0;
	const PUCKY = 0;

	let puck: DynParticle = $state({
		x: PUCKX,
		y: PUCKY,
		charge: 10,
		vx: 0,
		vy: 0,
	});

	// $inspect(puck);

	let puckTrace: [number, number][] = $state([[PUCKX, PUCKY]]);
	let traceString = $derived(
		`M${PUCKX},${PUCKY} ` +
			puckTrace.map(([x, y]) => `L${x},${y} `).reduce((p = '', c = '') => p + c),
	);

	// $inspect(puck);

	// Field dimensions
	let WIDTH = $state(300);
	let HEIGHT = $derived((2 / 3) * WIDTH);
	let STEP = $derived(Math.max(10, Math.round(WIDTH / 40)));

	type Point = [number, number];
	let vfCoords: Point[] = $derived.by(() => {
		const out: [number, number][] = [];

		for (let i = 1; i <= WIDTH / STEP; i++) {
			for (let j = 1; j <= HEIGHT / STEP; j++) {
				out.push([i * STEP - Math.round(WIDTH / 2), j * STEP - Math.round(HEIGHT / 2)]);
			}
		}
		return out;
	});

	// Playtime

	let go = $state(false);
	let last: number | undefined;
	let req: number | undefined;
	let clock = $state(0);

	function updatePuck(dt: number) {
		// make this adaptive?
		let runningTime = 0;
		let v = [puck.x, puck.y, puck.vx, puck.vy];
		let ticks = 0;
		while (runningTime < dt) {
			// const d = Math.hypot(...vf(v[0], v[1]));
			let h = Math.max(1e-8, dt / Math.max(10, Math.hypot(v[2], v[3])));
			h - Math.min(h, dt - runningTime);
			runningTime += h;

			for (let index = 0; index < 10; index++) {
				v = leapfrog(
					(x, y) => vf(x, y).map((c) => c * Math.pow(10, decay)),
					[v[2], v[3]],
					[v[0], v[1]],
					h,
				);
			}
			ticks += 1;
		}
		puck.x = v[0];
		puck.y = v[1];
		puck.vx = v[2];
		puck.vy = v[3];
		puckTrace.push([v[0], v[1]]);
		if (ticks > 11) console.log('tickss: ', ticks);
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

<div class="flex flex-col items-center">
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<svg
		bind:this={svg}
		xmlns="http://www.w3.org/2000/svg"
		viewBox="{-WIDTH / 2} {-HEIGHT / 2} {WIDTH} {HEIGHT}"
	>
		{#each vfCoords.map(([u, v]) => [u, v, ...vf(u, v)]) as [x, y, vx, vy]}
			{@render arrow(
				x,
				y,
				(STEP * vx) / Math.hypot(vx, vy),
				(STEP * vy) / Math.hypot(vx, vy),
				Math.pow(40, decay - 1) * Math.hypot(vx, vy),
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
				ondblclick={() => (particles = particles.filter((p) => p !== particle))}
			/>
		{/each}

		<circle cx={puck.x} cy={puck.y} r="3" fill="black" />
	</svg>

	<div
		class="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm"
	>
		<button
			class="rounded bg-green-500 px-4 py-2 font-medium text-white transition hover:bg-green-600"
			onclick={() => {
				go = !go;
				if (go) req = requestAnimationFrame(animate);
			}}
		>
			{go ? 'Pause' : 'Play'}
		</button>
		<button
			class="rounded bg-gray-500 px-4 py-2 font-medium text-white transition hover:bg-gray-600"
			onclick={() => {
				if (req) cancelAnimationFrame(req);
				clock = 0;
				last = undefined;
				go = false;
				puck = { x: PUCKY, y: -PUCKY, vx: 0, vy: 0, charge: 10 };
				puckTrace = [[PUCKX, PUCKY]];
			}}
		>
			Reset
		</button>
		<div>
			<span
				class="inline-block w-24 rounded border border-gray-300 bg-white p-2 text-center font-mono"
			>
				{Math.round(100 * clock) / 100}
			</span>
		</div>
		<button
			class="rounded bg-blue-500 px-4 py-2 font-medium text-white transition hover:bg-blue-600"
			onclick={() => {
				particles.push({
					x: (Math.random() - 1 / 2) * WIDTH,
					y: (Math.random() - 1 / 2) * HEIGHT,
					charge: 1,
				});
			}}
		>
			&oplus;
		</button>
		<button
			class="rounded bg-red-500 px-4 py-2 font-medium text-white transition hover:bg-red-600"
			onclick={() => {
				particles.push({
					x: (Math.random() - 1 / 2) * WIDTH,
					y: (Math.random() - 1 / 2) * HEIGHT,
					charge: -1,
				});
			}}
		>
			&ominus;
		</button>
		<div class="flex gap-2">
			<button
				class="rounded bg-gray-500 px-3 py-2 font-medium text-white transition hover:bg-gray-600"
				onclick={() => {
					WIDTH += 50;
				}}
			>
				&#x1F50D;&minus;
			</button>
			<button
				class="rounded bg-gray-500 px-3 py-2 font-medium text-white transition hover:bg-gray-600"
				onclick={() => {
					WIDTH = 300;
				}}
			>
				&#x1F50D;&deg;
			</button>
			<button
				class="rounded bg-gray-500 px-3 py-2 font-medium text-white transition hover:bg-gray-600"
				onclick={() => {
					WIDTH -= 50;
				}}
			>
				&#x1F50D;&plus;
			</button>
		</div>
	</div>

	<div
		class="flex flex-wrap items-center gap-6 rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm"
	>
		<label for="decay" class="flex items-center gap-2">
			<span class="font-medium">Decay rate</span>
			<input
				bind:value={decay}
				type="number"
				name="decay"
				class="w-20 rounded border border-gray-300 px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>
		<label for="charge" class="flex items-center gap-2">
			<span class="font-medium">Puck charge</span>
			<input
				bind:value={puck.charge}
				type="number"
				name="charge"
				class="w-20 rounded border border-gray-300 px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>
		<label for="trace" class="flex items-center gap-2">
			<span class="font-medium">Show Trace</span>
			<input
				type="checkbox"
				name="trace"
				bind:checked={showTrace}
				class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
			/>
		</label>
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss/theme";

	svg {
		border: 1px solid black;
		width: 100vw;
		max-width: 800px;
		height: auto;
	}
</style>
