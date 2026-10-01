import { Sidebar } from "@/components/Sidebar";
import { Topo } from "@/components/Topo";

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <Topo />
      <main className="ml-[224px] min-h-screen bg-surface-2 pt-[52px]">
        <div className="mx-auto max-w-[1400px] p-4">{children}</div>
      </main>
    </div>
  );
}
