import { relations } from "drizzle-orm";
import {
	cartScans,
	dailyLogs,
	notificationSettings,
	protocols,
	pushSubscriptions,
	shops,
	supplementSchedules,
	supplements,
	timeBlocks,
	users,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
	timeBlocks: many(timeBlocks),
	shops: many(shops),
	supplements: many(supplements),
	protocols: many(protocols),
	pushSubscriptions: many(pushSubscriptions),
	cartScans: many(cartScans),
	notificationSettings: many(notificationSettings),
}));

export const timeBlocksRelations = relations(timeBlocks, ({ one, many }) => ({
	user: one(users, { fields: [timeBlocks.userId], references: [users.id] }),
	schedules: many(supplementSchedules),
	notificationSettings: many(notificationSettings),
}));

export const shopsRelations = relations(shops, ({ one, many }) => ({
	user: one(users, { fields: [shops.userId], references: [users.id] }),
	supplements: many(supplements),
}));

export const supplementsRelations = relations(supplements, ({ one, many }) => ({
	user: one(users, { fields: [supplements.userId], references: [users.id] }),
	shop: one(shops, { fields: [supplements.shopId], references: [shops.id] }),
	schedules: many(supplementSchedules),
}));

export const protocolsRelations = relations(protocols, ({ one, many }) => ({
	user: one(users, { fields: [protocols.userId], references: [users.id] }),
	schedules: many(supplementSchedules),
}));

export const supplementSchedulesRelations = relations(supplementSchedules, ({ one, many }) => ({
	protocol: one(protocols, {
		fields: [supplementSchedules.protocolId],
		references: [protocols.id],
	}),
	supplement: one(supplements, {
		fields: [supplementSchedules.supplementId],
		references: [supplements.id],
	}),
	timeBlock: one(timeBlocks, {
		fields: [supplementSchedules.timeBlockId],
		references: [timeBlocks.id],
	}),
	dailyLogs: many(dailyLogs),
}));

export const dailyLogsRelations = relations(dailyLogs, ({ one }) => ({
	schedule: one(supplementSchedules, {
		fields: [dailyLogs.scheduleId],
		references: [supplementSchedules.id],
	}),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
	user: one(users, { fields: [pushSubscriptions.userId], references: [users.id] }),
}));

export const cartScansRelations = relations(cartScans, ({ one }) => ({
	user: one(users, { fields: [cartScans.userId], references: [users.id] }),
}));

export const notificationSettingsRelations = relations(notificationSettings, ({ one }) => ({
	user: one(users, { fields: [notificationSettings.userId], references: [users.id] }),
	timeBlock: one(timeBlocks, {
		fields: [notificationSettings.timeBlockId],
		references: [timeBlocks.id],
	}),
}));
