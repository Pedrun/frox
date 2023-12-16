export function clamp(x: number, min: number, max: number): number {
    return Math.max(min, Math.min(x, max));
}

export function map(
    x: number,
    in_min: number,
    in_max: number,
    out_min: number,
    out_max: number
) {
    return ((x - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
}

export function normalizeStr(str: string): string {
    if (typeof str !== 'string')
        throw new TypeError(`Expected string but got ${typeof str} instead`);
    return str.normalize('NFD').replace(/[\u0300-\u036F]/g, '');
}

// export function weightedRandom(prob: [key: string]: number) {
//     let k, sum=0, r=Math.random();
//     for (k in prob) {
//         sum += prob[k];
//         if (r <= sum) return k;
//     }
// }

export function ellipsis(text: string, limit = 2000): string {
    if (text.length > limit) return text.slice(0, limit - 3) + '...';
    return text;
}
