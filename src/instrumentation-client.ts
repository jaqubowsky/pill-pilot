window.addEventListener("error", (event) => {
	if (
		event.error instanceof DOMException &&
		event.error.name === "InvalidStateError" &&
		event.error.message.includes("ViewTransition")
	) {
		event.preventDefault();
	}
});
