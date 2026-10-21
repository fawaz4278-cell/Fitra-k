import { TabBar } from "@/components/ui/TabBar";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="min-h-[100dvh] pb-[calc(env(safe-area-inset-bottom)+100px)]">{children}</main>
      <TabBar />
    </>
  );
}
