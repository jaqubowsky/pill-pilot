import { LoginButton } from "./login-button";
import { LoginHeader } from "./login-header";

export function LoginPage() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-surface px-md">
			<LoginHeader />

			<LoginButton />
		</div>
	);
}
