import { ResultReveal } from "@/components/ResultReveal";
import { demoResults } from "@/lib/mock-data";

export default function ResultPage() {
  return <ResultReveal items={demoResults} />;
}
