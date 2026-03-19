const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function isPdf(file: File) {
	return file.type === "application/pdf" || file.name.endsWith(".pdf");
}

export function isExcel(file: File) {
	return (
		file.type.includes("spreadsheet") ||
		file.type.includes("excel") ||
		file.name.endsWith(".xlsx") ||
		file.name.endsWith(".xls")
	);
}

export function isImage(file: File) {
	return IMAGE_TYPES.includes(file.type);
}

export function isDocx(file: File) {
	return (
		file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
		file.name.endsWith(".docx")
	);
}

export function isText(file: File) {
	return file.type === "text/plain" || file.name.endsWith(".txt");
}

export function isSupportedFile(file: File) {
	return isPdf(file) || isExcel(file) || isDocx(file) || isImage(file) || isText(file);
}
