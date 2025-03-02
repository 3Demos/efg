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

export { normalize };
