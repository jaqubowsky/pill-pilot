import { and, eq } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { type ProtocolStatus, protocols } from "@/shared/db/schema";
import { ActionError, ActionErrorCode } from "@/shared/lib/safe-action";

type Protocol = typeof protocols.$inferSelect;
type NewProtocol = typeof protocols.$inferInsert;

interface IProtocolRepository {
	findByUserId(userId: string): Promise<Protocol[]>;
	findActiveByUserId(userId: string): Promise<Protocol[]>;
	findDraftByUserId(userId: string): Promise<Protocol | undefined>;
	findById(id: string): Promise<Protocol | undefined>;
	findByIdAndUserId(id: string, userId: string): Promise<Protocol>;
	create(data: NewProtocol): Promise<Protocol>;
	update(id: string, data: Partial<NewProtocol>): Promise<Protocol>;
	updateStatus(id: string, status: ProtocolStatus): Promise<Protocol>;
	delete(id: string): Promise<void>;
}

class ProtocolRepository implements IProtocolRepository {
	async findByUserId(userId: string): Promise<Protocol[]> {
		return db.select().from(protocols).where(eq(protocols.userId, userId));
	}

	async findActiveByUserId(userId: string): Promise<Protocol[]> {
		return db
			.select()
			.from(protocols)
			.where(and(eq(protocols.userId, userId), eq(protocols.status, "active")));
	}

	async findDraftByUserId(userId: string): Promise<Protocol | undefined> {
		const rows = await db
			.select()
			.from(protocols)
			.where(and(eq(protocols.userId, userId), eq(protocols.status, "draft")));
		return rows[0];
	}

	async findById(id: string): Promise<Protocol | undefined> {
		const rows = await db.select().from(protocols).where(eq(protocols.id, id));
		return rows[0];
	}

	async findByIdAndUserId(id: string, userId: string): Promise<Protocol> {
		const rows = await db
			.select()
			.from(protocols)
			.where(and(eq(protocols.id, id), eq(protocols.userId, userId)));
		const protocol = rows[0];
		if (!protocol) {
			throw new ActionError(ActionErrorCode.PROTOCOL_NOT_FOUND);
		}
		return protocol;
	}

	async create(data: NewProtocol): Promise<Protocol> {
		const rows = await db.insert(protocols).values(data).returning();
		return rows[0];
	}

	async update(id: string, data: Partial<NewProtocol>): Promise<Protocol> {
		const rows = await db.update(protocols).set(data).where(eq(protocols.id, id)).returning();
		return rows[0];
	}

	async updateStatus(id: string, status: ProtocolStatus): Promise<Protocol> {
		const rows = await db.update(protocols).set({ status }).where(eq(protocols.id, id)).returning();
		return rows[0];
	}

	async delete(id: string): Promise<void> {
		await db.delete(protocols).where(eq(protocols.id, id));
	}
}

export const protocolRepository: IProtocolRepository = new ProtocolRepository();
