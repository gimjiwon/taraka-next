import { SiteHeader } from "@/components/SiteHeader";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="container" style={{ maxWidth: 720 }}>
          <SignupForm />
        </div>
      </main>
    </>
  );
}
