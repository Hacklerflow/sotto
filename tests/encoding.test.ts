import { describe, it, expect } from 'vitest';
import { bytesToBase64, base64ToBytes } from '../src/lib/encoding';

describe('bytesToBase64', () => {
	it('encodes empty array', () => {
		expect(bytesToBase64(new Uint8Array([]))).toBe('');
	});

	it('encodes a known value', () => {
		const bytes = new TextEncoder().encode('hello');
		expect(bytesToBase64(bytes)).toBe('aGVsbG8=');
	});

	it('handles binary data with high bytes', () => {
		const bytes = new Uint8Array([0, 128, 255]);
		const result = bytesToBase64(bytes);
		expect(typeof result).toBe('string');
		expect(result.length).toBeGreaterThan(0);
	});
});

describe('base64ToBytes', () => {
	it('decodes empty string', () => {
		expect(base64ToBytes('')).toEqual(new Uint8Array([]));
	});

	it('decodes a known value', () => {
		const result = base64ToBytes('aGVsbG8=');
		expect(new TextDecoder().decode(result)).toBe('hello');
	});

	it('handles binary data roundtrip', () => {
		const original = new Uint8Array([0, 1, 127, 128, 254, 255]);
		const encoded = bytesToBase64(original);
		const decoded = base64ToBytes(encoded);
		expect(decoded).toEqual(original);
	});
});

describe('roundtrip', () => {
	it('preserves arbitrary byte sequences', () => {
		const sizes = [0, 1, 2, 3, 100, 256];
		for (const size of sizes) {
			const original = new Uint8Array(size);
			for (let index = 0; index < size; index++) original[index] = index % 256;
			const decoded = base64ToBytes(bytesToBase64(original));
			expect(decoded).toEqual(original);
		}
	});
});
