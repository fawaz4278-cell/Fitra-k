/** Re-mounts on every tab change, so each screen eases in. */
export default function TabsTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page">{children}</div>;
}
