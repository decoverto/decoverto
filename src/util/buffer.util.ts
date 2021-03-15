export function arrayBufferToString(buffer: ArrayBufferLike): string {
    return Array.from(new Uint16Array(buffer))
        .map(charCode => String.fromCharCode(charCode))
        .join('');
}

export function createArrayBufferFromString(input: string): ArrayBuffer {
    const buf = new ArrayBuffer(input.length * 2); // 2 bytes for each char
    const bufView = new Uint16Array(buf);

    for (let i = 0, strLen = input.length; i < strLen; i++) {
        bufView[i] = input.charCodeAt(i);
    }

    return buf;
}
