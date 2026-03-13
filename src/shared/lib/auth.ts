import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/shared/db/client";
import * as schema from "@/shared/db/schema";
import { timeBlockRepository } from "@/shared/repositories/time-block-repository";

const DEFAULT_TIME_BLOCKS = [
	{ name: "Na czczo", icon: "Sunrise", startTime: "06:30", sortOrder: 0 },
	{ name: "Śniadanie", icon: "Coffee", startTime: "08:00", sortOrder: 1 },
	{ name: "Obiad", icon: "Sun", startTime: "13:00", sortOrder: 2 },
	{ name: "Kolacja", icon: "Sunset", startTime: "19:00", sortOrder: 3 },
	{ name: "Przed snem", icon: "Moon", startTime: "22:00", sortOrder: 4 },
];

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: schema.users,
			session: schema.sessions,
			account: schema.accounts,
			verification: schema.verifications,
		},
	}),
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		},
	},
	baseURL: process.env.NEXT_PUBLIC_APP_URL!,
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					await Promise.all(
						DEFAULT_TIME_BLOCKS.map((block) =>
							timeBlockRepository.create({ ...block, userId: user.id }),
						),
					);
				},
			},
		},
	},
});
