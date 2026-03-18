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

export function parseDate(dateString: string): Date {
	const [y, m, d] = dateString.split("-").map(Number);
	return new Date(y, m - 1, d);
}

export function shiftDate(dateString: string, days: number): string {
	const d = parseDate(dateString);
	d.setDate(d.getDate() + days);
	return toDateString(d);
}

export function getMondayOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
	return d;
}

const shortWeekdayFormatter = new Intl.DateTimeFormat("pl-PL", { weekday: "short" });
const shortMonthFormatter = new Intl.DateTimeFormat("pl-PL", { month: "short" });

export function toShortWeekday(date: Date): string {
	return shortWeekdayFormatter.format(date);
}

export function toShortMonth(date: Date): string {
	return shortMonthFormatter.format(date);
}

const longWeekdayFormatter = new Intl.DateTimeFormat("pl-PL", { weekday: "long" });
const longDateFormatter = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" });

export function toLongDate(date: Date): string {
	const day = longWeekdayFormatter.format(date);
	const rest = longDateFormatter.format(date);
	return `${day.charAt(0).toUpperCase()}${day.slice(1)}, ${rest}`;
}

export function isToday(date: Date): boolean {
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d.getTime() === now.getTime();
}

export function toYearMonth(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	return `${y}-${m}`;
}

const longMonthFormatter = new Intl.DateTimeFormat("pl-PL", { month: "long" });

export function toMonthLabel(yearMonth: string): string {
	const [y, m] = yearMonth.split("-").map(Number);
	const name = longMonthFormatter.format(new Date(y, m - 1, 1));
	return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${y}`;
}

export function shiftYearMonth(yearMonth: string, offset: number): string {
	const [y, m] = yearMonth.split("-").map(Number);
	const d = new Date(y, m - 1 + offset, 1);
	return toYearMonth(d);
}

export function getFirstDayOfWeek(yearMonth: string): number {
	const [y, m] = yearMonth.split("-").map(Number);
	const day = new Date(y, m - 1, 1).getDay();
	return day === 0 ? 6 : day - 1;
}
