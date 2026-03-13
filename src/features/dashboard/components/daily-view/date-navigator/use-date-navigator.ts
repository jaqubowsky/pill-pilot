"use client";

const POLISH_DAYS = [
	"Niedziela",
	"Poniedziałek",
	"Wtorek",
	"Środa",
	"Czwartek",
	"Piątek",
	"Sobota",
];

const POLISH_MONTHS = [
	"stycznia",
	"lutego",
	"marca",
	"kwietnia",
	"maja",
	"czerwca",
	"lipca",
	"sierpnia",
	"września",
	"października",
	"listopada",
	"grudnia",
];

function formatPolishDate(date: Date): string {
	const day = POLISH_DAYS[date.getDay()];
	const d = date.getDate();
	const month = POLISH_MONTHS[date.getMonth()];
	return `${day}, ${d} ${month}`;
}

export function useDateNavigator(date: Date) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const dateOnly = new Date(date);
	dateOnly.setHours(0, 0, 0, 0);

	const isToday = dateOnly.getTime() === today.getTime();
	const formattedDate = formatPolishDate(date);

	return { isToday, formattedDate };
}
