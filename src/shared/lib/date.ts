const TZ = "Europe/Warsaw";

const timeFormatter = new Intl.DateTimeFormat("pl-PL", {
	timeZone: TZ,
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat("sv-SE", {
	timeZone: TZ,
});

export function toDateString(date: Date): string {
	return dateFormatter.format(date);
}

export function toTimeString(date: Date): string {
	return timeFormatter.format(date);
}
