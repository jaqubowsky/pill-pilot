import { and, eq } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { protocols, supplementSchedules } from "@/shared/db/schema";
import { ActionError, ActionErrorCode } from "@/shared/lib/safe-action";

type SupplementSchedule = typeof supplementSchedules.$inferSelect;
type NewSupplementSchedule = typeof supplementSchedules.$inferInsert;

interface ISupplementScheduleRepository {
	findById(id: string): Promise<SupplementSchedule | undefined>;
	findOwned(id: string, userId: string): Promise<SupplementSchedule>;
	findSiblings(protocolId: string, supplementId: string): Promise<SupplementSchedule[]>;
	hasActiveSchedulesForTimeBlock(timeBlockId: string): Promise<boolean>;
	create(data: NewSupplementSchedule): Promise<SupplementSchedule>;
	update(id: string, data: Partial<NewSupplementSchedule>): Promise<SupplementSchedule>;
	deleteByProtocolId(protocolId: string): Promise<void>;
	deactivateByProtocolId(protocolId: string): Promise<void>;
	reactivateByProtocolId(protocolId: string): Promise<void>;
	deactivateBySupplementId(supplementId: string): Promise<void>;
	deactivateFinishPackageBySupplementId(supplementId: string): Promise<void>;
	updateSiblings(
		protocolId: string,
		supplementId: string,
		data: Partial<NewSupplementSchedule>,
	): Promise<void>;
}

class SupplementScheduleRepository implements ISupplementScheduleRepository {
	async findById(id: string): Promise<SupplementSchedule | undefined> {
		const rows = await db.select().from(supplementSchedules).where(eq(supplementSchedules.id, id));
		return rows[0];
	}

	async findOwned(id: string, userId: string): Promise<SupplementSchedule> {
		const rows = await db
			.select({
				id: supplementSchedules.id,
				protocolId: supplementSchedules.protocolId,
				supplementId: supplementSchedules.supplementId,
				timeBlockId: supplementSchedules.timeBlockId,
				dosageAmount: supplementSchedules.dosageAmount,
				dosageUnit: supplementSchedules.dosageUnit,
				notes: supplementSchedules.notes,
				isCritical: supplementSchedules.isCritical,
				cycleDaysOn: supplementSchedules.cycleDaysOn,
				cycleDaysOff: supplementSchedules.cycleDaysOff,
				startDayOffset: supplementSchedules.startDayOffset,
				durationDays: supplementSchedules.durationDays,
				dosageIntervalMinutes: supplementSchedules.dosageIntervalMinutes,
				waitAfterTakingMinutes: supplementSchedules.waitAfterTakingMinutes,
				finishPackage: supplementSchedules.finishPackage,
				sortOrder: supplementSchedules.sortOrder,
				active: supplementSchedules.active,
				createdAt: supplementSchedules.createdAt,
			})
			.from(supplementSchedules)
			.innerJoin(protocols, eq(supplementSchedules.protocolId, protocols.id))
			.where(and(eq(supplementSchedules.id, id), eq(protocols.userId, userId)));

		const schedule = rows[0];
		if (!schedule) {
			throw new ActionError(ActionErrorCode.SCHEDULE_NOT_FOUND);
		}

		return schedule;
	}

	async findSiblings(protocolId: string, supplementId: string): Promise<SupplementSchedule[]> {
		return db
			.select()
			.from(supplementSchedules)
			.where(
				and(
					eq(supplementSchedules.protocolId, protocolId),
					eq(supplementSchedules.supplementId, supplementId),
				),
			);
	}

	async hasActiveSchedulesForTimeBlock(timeBlockId: string): Promise<boolean> {
		const rows = await db
			.select({ id: supplementSchedules.id })
			.from(supplementSchedules)
			.where(
				and(eq(supplementSchedules.timeBlockId, timeBlockId), eq(supplementSchedules.active, true)),
			);
		return rows.length > 0;
	}

	async create(data: NewSupplementSchedule): Promise<SupplementSchedule> {
		const rows = await db.insert(supplementSchedules).values(data).returning();
		return rows[0];
	}

	async update(id: string, data: Partial<NewSupplementSchedule>): Promise<SupplementSchedule> {
		const rows = await db
			.update(supplementSchedules)
			.set(data)
			.where(eq(supplementSchedules.id, id))
			.returning();
		return rows[0];
	}

	async deleteByProtocolId(protocolId: string): Promise<void> {
		await db.delete(supplementSchedules).where(eq(supplementSchedules.protocolId, protocolId));
	}

	async deactivateByProtocolId(protocolId: string): Promise<void> {
		await db
			.update(supplementSchedules)
			.set({ active: false })
			.where(eq(supplementSchedules.protocolId, protocolId));
	}

	async reactivateByProtocolId(protocolId: string): Promise<void> {
		await db
			.update(supplementSchedules)
			.set({ active: true })
			.where(eq(supplementSchedules.protocolId, protocolId));
	}

	async deactivateBySupplementId(supplementId: string): Promise<void> {
		await db
			.update(supplementSchedules)
			.set({ active: false })
			.where(eq(supplementSchedules.supplementId, supplementId));
	}

	async deactivateFinishPackageBySupplementId(supplementId: string): Promise<void> {
		await db
			.update(supplementSchedules)
			.set({ active: false })
			.where(
				and(
					eq(supplementSchedules.supplementId, supplementId),
					eq(supplementSchedules.finishPackage, true),
				),
			);
	}

	async updateSiblings(
		protocolId: string,
		supplementId: string,
		data: Partial<NewSupplementSchedule>,
	): Promise<void> {
		await db
			.update(supplementSchedules)
			.set(data)
			.where(
				and(
					eq(supplementSchedules.protocolId, protocolId),
					eq(supplementSchedules.supplementId, supplementId),
				),
			);
	}
}

export const supplementScheduleRepository: ISupplementScheduleRepository =
	new SupplementScheduleRepository();
