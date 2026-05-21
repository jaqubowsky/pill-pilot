import pg from "pg";
import { readFileSync } from "fs";
import { createId } from "@paralleldrive/cuid2";

const email = process.argv[2] || process.env.SEED_EMAIL || "jakub.nalewajk04@gmail.com";

const pool = new pg.Pool({
	connectionString: process.env.DATABASE_URL || "postgresql://pill-pilot-user:q9jzj8ux2hynrgpf@localhost:5432/pill-pilot-db",
});

try {
	console.log(`Checking if user ${email} exists...`);
	const userRes = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
	let userId;
	if (userRes.rows.length === 0) {
		userId = createId();
		console.log(`User not found. Creating user with ID: ${userId} and email: ${email}`);
		await pool.query(
			"INSERT INTO users (id, email, name, email_verified) VALUES ($1, $2, $3, true)",
			[userId, email, "Developer Jutra"]
		);
	} else {
		userId = userRes.rows[0].id;
		console.log(`User found with ID: ${userId}`);
	}

	// Ensure default time blocks exist. We'll insert blocks matching seed.sql expectations
	const timeBlocks = [
		{ name: "Na czczo", icon: "Sunrise", startTime: "06:30", sortOrder: 0 },
		{ name: "Śniadanie", icon: "Coffee", startTime: "08:00", sortOrder: 1 },
		{ name: "Drugie śniadanie", icon: "Apple", startTime: "10:30", sortOrder: 2 },
		{ name: "2. śniadanie", icon: "Apple", startTime: "10:30", sortOrder: 2 },
		{ name: "Przed obiadem", icon: "Clock", startTime: "12:30", sortOrder: 3 },
		{ name: "Obiad", icon: "Sun", startTime: "13:00", sortOrder: 4 },
		{ name: "Przed kolacją", icon: "Clock", startTime: "18:30", sortOrder: 5 },
		{ name: "Kolacja", icon: "Sunset", startTime: "19:00", sortOrder: 6 },
		{ name: "Po kolacji", icon: "UtensilsCrossed", startTime: "19:30", sortOrder: 7 },
		{ name: "Przed snem", icon: "Moon", startTime: "22:00", sortOrder: 8 },
	];

	console.log("Ensuring time blocks exist...");
	for (const tb of timeBlocks) {
		const tbRes = await pool.query(
			"SELECT id FROM time_blocks WHERE user_id = $1 AND name = $2",
			[userId, tb.name]
		);
		if (tbRes.rows.length === 0) {
			const tbId = createId();
			await pool.query(
				"INSERT INTO time_blocks (id, user_id, name, icon, start_time, active) VALUES ($1, $2, $3, $4, $5, true)",
				[tbId, userId, tb.name, tb.icon, tb.startTime]
			);
		}
	}

	console.log(`Running seed SQL for ${email}...`);
	const sql = readFileSync("scripts/seed.sql", "utf8").replaceAll("${SEED_EMAIL}", email);
	
	await pool.query(sql);
	console.log("Database seeded successfully!");
} catch (error) {
	console.error("Error seeding database:", error);
} finally {
	await pool.end();
}
