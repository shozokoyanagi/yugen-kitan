import HomePage from "../page";

export default function LiffPage({
  searchParams,
}: {
  searchParams: { month?: string; staffId?: string; lineUserId?: string };
}) {
  return <HomePage searchParams={searchParams} />;
}
