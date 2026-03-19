export function formatQuantity(amount: string | number): string {
	const n = typeof amount === "number" ? amount : Number(amount);
	if (Number.isNaN(n)) return String(amount);
	return n % 1 === 0 ? n.toFixed(0) : String(amount);
}

export function formatAmount(amount: number): string {
	return amount.toFixed(2).replace(".", ",");
}
