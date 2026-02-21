import { AppSidebar } from "@/components/AppSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="py-3 text-center text-[10px] text-muted-foreground border-t border-border">
          © {new Date().getFullYear()} Wednescrown Enterprise. Todos os direitos reservados.
        </footer>
      </main>
    </div>
  );
}
