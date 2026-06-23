import { JunelStoreProvider } from "@/components/providers/junel-store-provider";
import { LoginConsole } from "@/components/organisms/login-console";

export default function LoginPage() {
  return (
    <JunelStoreProvider>
      <main className="bg-background text-on-background font-body-md antialiased min-h-screen flex items-center justify-center p-md">
        <LoginConsole />
      </main>
    </JunelStoreProvider>
  );
}
