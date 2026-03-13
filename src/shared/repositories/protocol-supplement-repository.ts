import { and, eq } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { protocolSupplements } from "@/shared/db/schema";

type ProtocolSupplement = typeof protocolSupplements.$inferSelect;
type NewProtocolSupplement = typeof protocolSupplements.$inferInsert;

interface IProtocolSupplementRepository {
	findById(id: string): Promise<ProtocolSupplement | undefined>;
	findByProtocolId(protocolId: string): Promise<ProtocolSupplement[]>;
	findByProtocolAndSupplement(
		protocolId: string,
		supplementId: string,
	): Promise<ProtocolSupplement | undefined>;
	create(data: NewProtocolSupplement): Promise<ProtocolSupplement>;
	update(id: string, data: Partial<NewProtocolSupplement>): Promise<ProtocolSupplement>;
	deactivateByProtocolId(protocolId: string): Promise<void>;
	reactivateByProtocolId(protocolId: string): Promise<void>;
	deactivateBySupplementId(supplementId: string): Promise<void>;
}

class ProtocolSupplementRepository implements IProtocolSupplementRepository {
	async findById(id: string): Promise<ProtocolSupplement | undefined> {
		const rows = await db.select().from(protocolSupplements).where(eq(protocolSupplements.id, id));
		return rows[0];
	}

	async findByProtocolId(protocolId: string): Promise<ProtocolSupplement[]> {
		return db
			.select()
			.from(protocolSupplements)
			.where(eq(protocolSupplements.protocolId, protocolId));
	}

	async findByProtocolAndSupplement(
		protocolId: string,
		supplementId: string,
	): Promise<ProtocolSupplement | undefined> {
		const rows = await db
			.select()
			.from(protocolSupplements)
			.where(
				and(
					eq(protocolSupplements.protocolId, protocolId),
					eq(protocolSupplements.supplementId, supplementId),
				),
			);
		return rows[0];
	}

	async create(data: NewProtocolSupplement): Promise<ProtocolSupplement> {
		const rows = await db.insert(protocolSupplements).values(data).returning();
		return rows[0];
	}

	async update(id: string, data: Partial<NewProtocolSupplement>): Promise<ProtocolSupplement> {
		const rows = await db
			.update(protocolSupplements)
			.set(data)
			.where(eq(protocolSupplements.id, id))
			.returning();
		return rows[0];
	}

	async deactivateByProtocolId(protocolId: string): Promise<void> {
		await db
			.update(protocolSupplements)
			.set({ active: false })
			.where(eq(protocolSupplements.protocolId, protocolId));
	}

	async reactivateByProtocolId(protocolId: string): Promise<void> {
		await db
			.update(protocolSupplements)
			.set({ active: true })
			.where(eq(protocolSupplements.protocolId, protocolId));
	}

	async deactivateBySupplementId(supplementId: string): Promise<void> {
		await db
			.update(protocolSupplements)
			.set({ active: false })
			.where(eq(protocolSupplements.supplementId, supplementId));
	}
}

export const protocolSupplementRepository: IProtocolSupplementRepository =
	new ProtocolSupplementRepository();
