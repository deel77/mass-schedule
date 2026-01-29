import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { convexQuery } from "@/lib/convexClient";
import { DashboardClient } from "@/components/DashboardClient";
import { t } from "@/lib/i18n";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).id) {
    redirect("/login");
  }

  const actorId = (session.user as any).id as string;
  const parishes = (await convexQuery("parishes:listForUser", { actorId })) as any[];
  const sortedParishes = [...parishes].sort((a, b) => a.name.localeCompare(b.name));
  const initialParishId = sortedParishes[0]?._id || "";

  if (!initialParishId) {
    return (
      <div className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-2xl space-y-4">
          <h1 className="text-3xl font-semibold">
            {t("sk", "noParishTitle", "Nemáte priradenú farnosť")}
          </h1>
          <p className="text-sm text-neutral-300">
            {t(
              "sk",
              "noParishMessage",
              "Požiadajte superadmina o priradenie aspoň jednej farnosti."
            )}
          </p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const initialWeek = (await convexQuery("schedules:getWeekView", {
    parishId: initialParishId,
    date: today
  })) as any;
  const initialLocations = (await convexQuery("locations:listByParish", {
    parishId: initialParishId
  })) as any[];

  return (
    <DashboardClient
      parishes={sortedParishes}
      initialParishId={initialParishId}
      initialWeek={initialWeek}
      initialLocations={initialLocations}
      userName={session.user.name || ""}
    />
  );
}
