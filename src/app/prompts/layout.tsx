import { NavbarAuthenticated } from "@/components/layout/navbar-authenticated";

export default function PromptsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-background flex flex-col">
      <NavbarAuthenticated />
      {children}
    </div>
  );
}
