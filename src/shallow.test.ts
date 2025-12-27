import { shallow } from "./shallow.js";

describe("shallow", () => {
	describe("primitives", () => {
		it("should return true for identical primitives", () => {
			expect(shallow(1, 1)).toBe(true);
			expect(shallow("hello", "hello")).toBe(true);
			expect(shallow(true, true)).toBe(true);
			expect(shallow(null, null)).toBe(true);
			expect(shallow(undefined, undefined)).toBe(true);
		});

		it("should return false for different primitives", () => {
			expect(shallow(1, 2)).toBe(false);
			expect(shallow("hello", "world")).toBe(false);
			expect(shallow(true, false)).toBe(false);
			expect(shallow(null, undefined)).toBe(false);
		});

		it("should handle NaN correctly", () => {
			expect(shallow(Number.NaN, Number.NaN)).toBe(true);
		});
	});

	describe("arrays", () => {
		it("should return true for shallowly equal arrays", () => {
			expect(shallow([1, 2, 3], [1, 2, 3])).toBe(true);
			expect(shallow(["a", "b"], ["a", "b"])).toBe(true);
			expect(shallow([], [])).toBe(true);
		});

		it("should return false for arrays with different values", () => {
			expect(shallow([1, 2, 3], [1, 2, 4])).toBe(false);
			expect(shallow([1, 2], [1, 2, 3])).toBe(false);
		});

		it("should return false for arrays with same nested objects but different references", () => {
			const obj1 = { a: 1 };
			const obj2 = { a: 1 };
			expect(shallow([obj1], [obj2])).toBe(false);
		});

		it("should return true for arrays with same object references", () => {
			const obj = { a: 1 };
			expect(shallow([obj], [obj])).toBe(true);
		});
	});

	describe("objects", () => {
		it("should return true for shallowly equal objects", () => {
			expect(shallow({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
			expect(shallow({}, {})).toBe(true);
		});

		it("should return false for objects with different values", () => {
			expect(shallow({ a: 1 }, { a: 2 })).toBe(false);
		});

		it("should return false for objects with different keys", () => {
			expect(shallow({ a: 1 }, { b: 1 })).toBe(false);
			expect(shallow({ a: 1 }, { a: 1, b: 2 })).toBe(false);
		});

		it("should return false for nested objects with different references", () => {
			expect(shallow({ a: { b: 1 } }, { a: { b: 1 } })).toBe(false);
		});

		it("should return true for objects with same nested references", () => {
			const nested = { b: 1 };
			expect(shallow({ a: nested }, { a: nested })).toBe(true);
		});
	});

	describe("Maps", () => {
		it("should return true for shallowly equal Maps", () => {
			const map1 = new Map([
				["a", 1],
				["b", 2],
			]);
			const map2 = new Map([
				["a", 1],
				["b", 2],
			]);
			expect(shallow(map1, map2)).toBe(true);
		});

		it("should return false for Maps with different values", () => {
			const map1 = new Map([["a", 1]]);
			const map2 = new Map([["a", 2]]);
			expect(shallow(map1, map2)).toBe(false);
		});

		it("should return false for Maps with different keys", () => {
			const map1 = new Map([["a", 1]]);
			const map2 = new Map([["b", 1]]);
			expect(shallow(map1, map2)).toBe(false);
		});
	});

	describe("Sets", () => {
		it("should return true for shallowly equal Sets", () => {
			const set1 = new Set([1, 2, 3]);
			const set2 = new Set([1, 2, 3]);
			expect(shallow(set1, set2)).toBe(true);
		});

		it("should return false for Sets with different values", () => {
			const set1 = new Set([1, 2]);
			const set2 = new Set([1, 3]);
			expect(shallow(set1, set2)).toBe(false);
		});

		it("should return false for Sets with different sizes", () => {
			const set1 = new Set([1, 2]);
			const set2 = new Set([1, 2, 3]);
			expect(shallow(set1, set2)).toBe(false);
		});
	});

	describe("mixed types", () => {
		it("should return false for different types", () => {
			expect(shallow([], {})).toBe(false);
			expect(shallow({}, null)).toBe(false);
			expect(shallow(1 as unknown, "1")).toBe(false);
		});

		it("should return false for object vs array", () => {
			expect(shallow({ 0: "a", 1: "b" }, ["a", "b"])).toBe(false);
		});
	});

	describe("same reference", () => {
		it("should return true for same reference", () => {
			const arr = [1, 2, 3];
			const obj = { a: 1 };
			expect(shallow(arr, arr)).toBe(true);
			expect(shallow(obj, obj)).toBe(true);
		});
	});
});
