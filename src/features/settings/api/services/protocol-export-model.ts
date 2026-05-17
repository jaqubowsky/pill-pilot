export function toExportFilename(name: string, ext: "pdf" | "xlsx", dateString: string): string {
	const slug = name
		.replace(/[łŁ]/g, "l")
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	const base = slug.length > 0 ? slug : "protokol";
	return `${base}-${dateString}.${ext}`;
}
