/**
 * Gives the 2-norm of vector (dx,dy)
 *
 * @param {Number} dx
 * @param {Number} dy
 * @returns Number
 */
function norm(dx, dy) {
	return Math.sqrt(dx * dx + dy * dy);
}

export { norm };
