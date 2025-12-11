import { NavbarAuthenticated } from "@/components/layout/navbar-authenticated";

export default function PromptsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <NavbarAuthenticated />
      {children}
    </div>
  );
}
