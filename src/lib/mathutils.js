/**
 *
 * @param {number} dx
 * @param {number} dy
 * @returns [number, number]
 */
function normalize(dx, dy) {
	const n = Math.hypot(dx, dy);
	if (n > 0) {
		return [dx / n, dy / n];
	} else {
		return [0, 0];
	}
}

/**
 * scalar multiplication
 * @param {number[]} v vector
 * @param {number} c scalar
 * @returns number[]
 */
function scale(v, c) {
	return v.map((e) => e * c);
}

/**
 * vector addition
 * @param {number[]} v vector
 * @param {number[]} w vector
 * @returns number[]
 */
function add(v, w) {
	return v.map((e, i) => e + w[i]);
}

/**
 * Runge-Kutta method
 * @param {(v: number[]) => number[]} F a vector field
 * @param {number[]} x initial value
 * @param {number} dt time step
 * @returns number[]
 */
function rk4(F, x, dt) {
	// const n = x.length;

	const f1 = scale(F(x), dt);
	const f2 = scale(F(add(x, scale(f1, 1 / 2))), dt);
	const f3 = scale(F(add(x, scale(f2, 1 / 2))), dt);
	const f4 = scale(F(add(x, f3)), dt);

	return add(x, scale([f1, scale(f2, 2), scale(f3, 2), f4].reduce(add), 1 / 6));
}

/**
 * Velnet
 * @param {(...v: number[]) => number[]} a acceleration field
 * @param {number[]} v velocity
 * @param {number[]} x position
 * @param {number} dt time step
 * @returns number[] new state
 */
function leapfrog(a, v, x, dt) {
	// const n = x.length;

	const vhalf = add(v, scale(a(...x), dt / 2));
	const xfull = add(x, scale(vhalf, dt));
	const vfull = add(vhalf, scale(a(...xfull), dt));

	return [...xfull, ...vfull];
}

export { normalize, rk4, leapfrog };
