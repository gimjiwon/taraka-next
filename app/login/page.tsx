import { SiteHeader } from "@/components/SiteHeader";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="container" style={{ maxWidth: 560 }}>
          <LoginForm />
        </div>
      </main>
    </>
  );
}
