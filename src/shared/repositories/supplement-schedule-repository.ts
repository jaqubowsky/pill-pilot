import { and, eq } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { protocolSupplements, supplementSchedules } from "@/shared/db/schema";

type SupplementSchedule = typeof supplementSchedules.$inferSelect;
type NewSupplementSchedule = typeof supplementSchedules.$inferInsert;

type ScheduleWithContext = SupplementSchedule & { supplementId: string };

interface ISupplementScheduleRepository {
	findById(id: string): Promise<SupplementSchedule | undefined>;
	findWithContext(id: string): Promise<ScheduleWithContext | undefined>;
	findByProtocolSupplementId(protocolSupplementId: string): Promise<SupplementSchedule[]>;
	hasActiveSchedulesForTimeBlock(timeBlockId: string): Promise<boolean>;
	create(data: NewSupplementSchedule): Promise<SupplementSchedule>;
	update(id: string, data: Partial<NewSupplementSchedule>): Promise<SupplementSchedule>;
	deleteByProtocolSupplementId(protocolSupplementId: string): Promise<void>;
}

class SupplementScheduleRepository implements ISupplementScheduleRepository {
	async findById(id: string): Promise<SupplementSchedule | undefined> {
		const rows = await db.select().from(supplementSchedules).where(eq(supplementSchedules.id, id));
		return rows[0];
	}

	async findWithContext(id: string): Promise<ScheduleWithContext | undefined> {
		const rows = await db
			.select({
				id: supplementSchedules.id,
				protocolSupplementId: supplementSchedules.protocolSupplementId,
				timeBlockId: supplementSchedules.timeBlockId,
				dosageAmount: supplementSchedules.dosageAmount,
				dosageUnit: supplementSchedules.dosageUnit,
				supplementId: protocolSupplements.supplementId,
			})
			.from(supplementSchedules)
			.innerJoin(
				protocolSupplements,
				eq(supplementSchedules.protocolSupplementId, protocolSupplements.id),
			)
			.where(eq(supplementSchedules.id, id));
		return rows[0];
	}

	async findByProtocolSupplementId(protocolSupplementId: string): Promise<SupplementSchedule[]> {
		return db
			.select()
			.from(supplementSchedules)
			.where(eq(supplementSchedules.protocolSupplementId, protocolSupplementId));
	}

	async hasActiveSchedulesForTimeBlock(timeBlockId: string): Promise<boolean> {
		const rows = await db
			.select({ id: supplementSchedules.id })
			.from(supplementSchedules)
			.innerJoin(
				protocolSupplements,
				eq(supplementSchedules.protocolSupplementId, protocolSupplements.id),
			)
			.where(
				and(eq(supplementSchedules.timeBlockId, timeBlockId), eq(protocolSupplements.active, true)),
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

	async deleteByProtocolSupplementId(protocolSupplementId: string): Promise<void> {
		await db
			.delete(supplementSchedules)
			.where(eq(supplementSchedules.protocolSupplementId, protocolSupplementId));
	}
}

export const supplementScheduleRepository: ISupplementScheduleRepository =
	new SupplementScheduleRepository();
