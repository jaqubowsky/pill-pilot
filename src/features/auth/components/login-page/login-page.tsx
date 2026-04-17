import { LoginButton } from "./login-button";
import { LoginHeader } from "./login-header";

type LoginPageProps = {
	callbackUrl?: string;
};

export function LoginPage({ callbackUrl }: LoginPageProps) {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-surface px-md max-w-lg mx-auto gap-md">
			<LoginHeader />
			<LoginButton callbackUrl={callbackUrl} />
		</div>
	);
}
