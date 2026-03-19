import { describe, expect, it } from "vitest";
import { DosageUnit, SupplementCategory } from "@/shared/db/schema";
import type { EditedSupplement } from "../components/protocol-base/parsed-preview.schema";
import type { ParsedSupplement } from "../schemas/parsed-protocol-schema";
import { toIdentifiedSupplements, toSerializedProtocol } from "./supplement-serialization";

function makeParsedSupplement(overrides: Partial<ParsedSupplement> = {}): ParsedSupplement {
	return {
		name: "Vitamin D",
		existingSupplementId: null,
		brandName: null,
		category: SupplementCategory.supplement,
		isCritical: false,
		notes: "z posiłkiem",
		cycleDaysOn: null,
		cycleDaysOff: null,
		startDayOffset: 0,
		durationDays: null,
		dosageIntervalMinutes: null,
		waitAfterTakingMinutes: 30,
		confidence: 0.95,
		uncertaintyReason: null,
		schedules: [
			{
				dosageAmount: 1,
				dosageUnit: DosageUnit.capsule,
				timeBlockId: "tb1",
			},
		],
		...overrides,
	};
}

function makeIdentified(overrides: Partial<EditedSupplement> = {}) {
	return {
		_id: "test-1",
		name: "Vitamin D",
		existingSupplementId: null,
		brandName: null,
		category: SupplementCategory.supplement as const,
		isCritical: false,
		notes: null,
		cycleDaysOn: null,
		cycleDaysOff: null,
		startDayOffset: 0,
		durationDays: null,
		dosageIntervalMinutes: null,
		waitAfterTakingMinutes: null,
		confidence: 1,
		uncertaintyReason: null,
		schedules: [
			{
				dosageAmount: 1,
				dosageUnit: DosageUnit.capsule as const,
				timeBlockId: "tb1",
				notes: null,
				isCritical: false,
				waitAfterTakingMinutes: null,
				cycleDaysOn: null,
				cycleDaysOff: null,
				startDayOffset: 0,
				durationDays: null,
			},
		],
		...overrides,
	};
}

describe("toIdentifiedSupplements", () => {
	it("assigns unique _id to each supplement", () => {
		const result = toIdentifiedSupplements([makeParsedSupplement(), makeParsedSupplement()]);

		expect(result).toHaveLength(2);
		expect(result[0]._id).toBeTruthy();
		expect(result[1]._id).toBeTruthy();
		expect(result[0]._id).not.toBe(result[1]._id);
	});

	it("resolves schedule fields from supplement-level fallbacks", () => {
		const parsed = makeParsedSupplement({
			notes: "z posiłkiem",
			waitAfterTakingMinutes: 30,
			schedules: [
				{
					dosageAmount: 1,
					dosageUnit: DosageUnit.capsule,
					timeBlockId: "tb1",
				},
			],
		});

		const [result] = toIdentifiedSupplements([parsed]);

		expect(result.schedules[0].notes).toBe("z posiłkiem");
		expect(result.schedules[0].waitAfterTakingMinutes).toBe(30);
	});

	it("prefers schedule-level values over supplement-level", () => {
		const parsed = makeParsedSupplement({
			notes: "supplement note",
			schedules: [
				{
					dosageAmount: 2,
					dosageUnit: DosageUnit.capsule,
					timeBlockId: "tb1",
					notes: "schedule note",
				},
			],
		});

		const [result] = toIdentifiedSupplements([parsed]);

		expect(result.schedules[0].notes).toBe("schedule note");
	});
});

describe("toSerializedProtocol", () => {
	it("serializes to valid JSON with protocolName and supplements", () => {
		const json = toSerializedProtocol("My Protocol", [makeIdentified()]);
		const parsed = JSON.parse(json);

		expect(parsed.protocolName).toBe("My Protocol");
		expect(parsed.supplements).toHaveLength(1);
		expect(parsed.supplements[0].name).toBe("Vitamin D");
	});

	it("strips _id and _removed from output", () => {
		const json = toSerializedProtocol("Test", [makeIdentified()]);
		const parsed = JSON.parse(json);

		expect(parsed.supplements[0]._id).toBeUndefined();
		expect(parsed.supplements[0]._removed).toBeUndefined();
	});

	it("filters out _removed supplements by default", () => {
		const json = toSerializedProtocol("Test", [
			makeIdentified(),
			{ ...makeIdentified(), _id: "test-2", _removed: true },
		]);
		const parsed = JSON.parse(json);

		expect(parsed.supplements).toHaveLength(1);
	});

	it("includes _removed supplements with includeDraft option", () => {
		const json = toSerializedProtocol(
			"Test",
			[makeIdentified(), { ...makeIdentified(), _id: "test-2", _removed: true }],
			{ includeDraft: true },
		);
		const parsed = JSON.parse(json);

		expect(parsed.supplements).toHaveLength(2);
	});
});
