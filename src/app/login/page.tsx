import { LoginForm } from "./login-form";

export default async function LoginPage(props: {
  searchParams: Promise<{ message?: string }>;
}) {
  const searchParams = await props.searchParams;

  return <LoginForm initialMessage={searchParams?.message ?? null} />;
}
