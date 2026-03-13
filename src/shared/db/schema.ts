import { createId } from "@paralleldrive/cuid2";
import {
	type AnyPgColumn,
	boolean,
	date,
	decimal,
	integer,
	json,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";

function enumToMap<T extends readonly [string, ...string[]]>(values: T) {
	return Object.fromEntries(values.map((v) => [v, v])) as { [K in T[number]]: K };
}

export const onboardingStepEnum = pgEnum("onboarding_step", ["upload", "preview", "complete"]);
export const ONBOARDING_STEPS = onboardingStepEnum.enumValues;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];
export const OnboardingStep = enumToMap(ONBOARDING_STEPS);

export const supplementCategoryEnum = pgEnum("supplement_category", [
	"medication",
	"supplement",
	"vitamin",
	"mineral",
	"probiotic",
	"herb",
	"amino_acid",
	"other",
]);
export const SUPPLEMENT_CATEGORIES = supplementCategoryEnum.enumValues;
export type SupplementCategory = (typeof SUPPLEMENT_CATEGORIES)[number];
export const SupplementCategory = enumToMap(SUPPLEMENT_CATEGORIES);

export const protocolStatusEnum = pgEnum("protocol_status", ["draft", "active", "archived"]);
export const PROTOCOL_STATUSES = protocolStatusEnum.enumValues;
export type ProtocolStatus = (typeof PROTOCOL_STATUSES)[number];
export const ProtocolStatus = enumToMap(PROTOCOL_STATUSES);

export const dosageUnitEnum = pgEnum("dosage_unit", [
	"capsule",
	"tablet",
	"ml",
	"drops",
	"g",
	"mg",
	"scoop",
	"sachet",
	"spray",
	"portion",
]);
export const DOSAGE_UNITS = dosageUnitEnum.enumValues;
export type DosageUnit = (typeof DOSAGE_UNITS)[number];
export const DosageUnit = enumToMap(DOSAGE_UNITS);

export const users = pgTable("users", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	email: text("email").notNull().unique(),
	name: text("name"),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	onboardingStep: onboardingStepEnum("onboarding_step").notNull().default("upload"),
	settings: json("settings"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("accounts", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const timeBlocks = pgTable("time_blocks", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	icon: text("icon").notNull(),
	startTime: text("start_time").notNull(),
	sortOrder: integer("sort_order").notNull(),
	active: boolean("active").notNull().default(true),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const supplements = pgTable("supplements", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	brandName: text("brand_name"),
	category: supplementCategoryEnum("category").notNull().default("supplement"),
	stockUnit: dosageUnitEnum("stock_unit").notNull().default("capsule"),
	currentStock: decimal("current_stock", { precision: 10, scale: 2 }),
	packageSize: integer("package_size"),
	packagePrice: decimal("package_price", { precision: 10, scale: 2 }),
	active: boolean("active").notNull().default(true),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const protocols = pgTable("protocols", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	parsedData: text("parsed_data").notNull(),
	status: protocolStatusEnum("status").notNull().default("draft"),
	startDate: date("start_date"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const protocolSupplements = pgTable(
	"protocol_supplements",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		protocolId: text("protocol_id")
			.notNull()
			.references(() => protocols.id, { onDelete: "cascade" }),
		supplementId: text("supplement_id")
			.notNull()
			.references(() => supplements.id, { onDelete: "cascade" }),
		notes: text("notes"),
		isCritical: boolean("is_critical").notNull().default(false),
		cycleDaysOn: integer("cycle_days_on"),
		cycleDaysOff: integer("cycle_days_off"),
		prerequisiteId: text("prerequisite_id").references((): AnyPgColumn => protocolSupplements.id, {
			onDelete: "set null",
		}),
		delayDays: integer("delay_days"),
		sortOrder: integer("sort_order").notNull().default(0),
		active: boolean("active").notNull().default(true),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => ({
		uniqueProtocolSupplement: unique().on(table.protocolId, table.supplementId),
	}),
);

export const supplementSchedules = pgTable("supplement_schedules", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	protocolSupplementId: text("protocol_supplement_id")
		.notNull()
		.references(() => protocolSupplements.id, { onDelete: "cascade" }),
	timeBlockId: text("time_block_id")
		.notNull()
		.references(() => timeBlocks.id, { onDelete: "cascade" }),
	dosageAmount: decimal("dosage_amount", { precision: 10, scale: 2 }).notNull(),
	dosageUnit: dosageUnitEnum("dosage_unit").notNull(),
});

export const dailyLogs = pgTable(
	"daily_logs",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		scheduleId: text("schedule_id")
			.notNull()
			.references(() => supplementSchedules.id, { onDelete: "cascade" }),
		date: date("date").notNull(),
		takenAt: timestamp("taken_at").notNull().defaultNow(),
	},
	(table) => ({
		uniqueScheduleDate: unique().on(table.scheduleId, table.date),
	}),
);
