import { MethodologyPageContent } from "@/components/metodologia/MethodologyPageContent";

export const metadata = {
  title: "Metodología — RASTRO",
  description: "Metodología, fuentes y limitaciones de RASTRO.",
};

export default function MetodologiaPage() {
  return (
    <main className="min-h-screen bg-[#030508]">
      <MethodologyPageContent />
    </main>
  );
}
