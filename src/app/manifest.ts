import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Pill Pilot",
		short_name: "Pill Pilot",
		description: "Twój dzienny pilot suplementów",
		start_url: "/dashboard",
		display: "standalone",
		background_color: "#FAF7F2",
		theme_color: "#FAF7F2",
		icons: [
			{
				src: "/icon-192x192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				src: "/icon-512x512.png",
				sizes: "512x512",
				type: "image/png",
			},
		],
	};
}
