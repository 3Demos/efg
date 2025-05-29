/**
 * Normalize a 3D vector
 * @param {number} dx
 * @param {number} dy
 * @param {number} dz
 * @returns {[number, number, number]}
 */
function normalize(dx, dy, dz) {
    const n = Math.hypot(dx, dy, dz);
    if (n > 0) {
        return [dx / n, dy / n, dz / n];
    } else {
        return [0, 0, 0];
    }
}

/**
 * Scalar multiplication
 * @param {number[]} v
 * @param {number} c
 * @returns {number[]}
 */
function scale(v, c) {
    return v.map((e) => e * c);
}

/**
 * Vector addition
 * @param {number[]} v
 * @param {number[]} w
 * @returns {number[]}
 */
function add(v, w) {
    return v.map((e, i) => e + w[i]);
}

/**
 * Runge-Kutta 4th order method (RK4) for 3D
 * @param {(v: number[]) => number[]} F
 * @param {number[]} x
 * @param {number} dt
 * @returns {number[]}
 */
function rk4(F, x, dt) {
    const f1 = scale(F(x), dt);
    const f2 = scale(F(add(x, scale(f1, 0.5))), dt);
    const f3 = scale(F(add(x, scale(f2, 0.5))), dt);
    const f4 = scale(F(add(x, f3)), dt);

    return add(x, scale([f1, scale(f2, 2), scale(f3, 2), f4].reduce(add), 1 / 6));
}

/**
 * Leapfrog integration method for 3D motion
 * @param {(x: number, y: number, z: number) => number[]} a acceleration field
 * @param {[number, number, number]} v velocity vector [vx, vy, vz]
 * @param {[number, number, number]} x position vector [x, y, z]
 * @param {number} dt time step
 * @returns {[number, number, number, number, number, number]} new state [x, y, z, vx, vy, vz]
 */
function leapfrog(a, v, x, dt) {
    const vhalf = add(v, scale(a(x[0], x[1], x[2]), dt / 2));
    const xfull = add(x, scale(vhalf, dt));
    const vfull = add(vhalf, scale(a(xfull[0], xfull[1], xfull[2]), dt));
    return [xfull[0],xfull[1],xfull[2],vfull[0],vfull[1],vfull[2]];
}

export { normalize, scale, add, rk4, leapfrog };











