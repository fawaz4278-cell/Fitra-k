export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return <div className="pb-[calc(env(safe-area-inset-bottom)+60px)]">{children}</div>;
}
