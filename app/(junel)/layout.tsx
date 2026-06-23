import { JunelShell } from "@/components/organisms/junel-shell";

export default function JunelLayout({ children }: { children: React.ReactNode }) {
  return <JunelShell>{children}</JunelShell>;
}
