import { Dashboard } from "@/components/Dashboard";
import { getDashboardData, getScrapeDays } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [data, scrapeDays] = await Promise.all([getDashboardData(), getScrapeDays()]);
  return <Dashboard data={data} scrapeDays={scrapeDays} />;
}
