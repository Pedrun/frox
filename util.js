module.exports = {
    /**
     * 
     * @param {number} x 
     * @param {number} min 
     * @param {number} max 
     * @returns {number}
     */
    clamp(x, min, max) {
        return Math.max(min, Math.min(x, max));
    },

    /**
     * 
     * @param {number} x 
     * @param {number} in_min 
     * @param {number} in_max 
     * @param {number} out_min 
     * @param {number} out_max 
     * @returns {number}
     */
    map(x, in_min, in_max, out_min, out_max) {
        return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    },

    /**
     * 
     * @param {string} str String with diacritics
     * @returns {string} String without diacritics
     */
    normalizeStr(str) {
        if (str == null) return;
        if (typeof str !== 'string') throw new TypeError(`Expected string but got ${typeof str} instead`);
        return str.normalize('NFD').replace(/[\u0300-\u036F]/g, '');
    },

    /**
     * 
     * @param {number} min 
     * @param {number} max 
     * @returns {number} random
     */
    randomInt(min, max) {
        min = Math.floor(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1) + min);
    },

    weightedRandom(prob) {
        let i, sum=0, r=Math.random();
        for (i in prob) {
            sum += prob[i];
            if (r <= sum) return i;
        }
    },

    ellipsis(text, limit=2000) {
        if (text.length > limit)
            return text.slice(0, limit-3) + "...";
        return text;
    }
}
