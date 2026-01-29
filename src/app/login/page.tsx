import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
import { t } from "@/lib/i18n";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-emerald-50">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-between gap-12 px-6 py-12">
        <div className="hidden max-w-md flex-col gap-6 lg:flex">
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-neutral-400">
            {t("sk", "appTitle", "Program OMŠI")}
          </span>
          <h1 className="text-4xl font-semibold text-neutral-900">
            {t("sk", "loginIntroTitle", "Správa programu farností")}
          </h1>
          <p className="text-base text-neutral-600">
            {t(
              "sk",
              "loginIntroText",
              "Pripravujte týždenné programy, spravujte farnosti a zdieľajte API prístup."
            )}
          </p>
          <div className="rounded-3xl border border-neutral-200 bg-white/80 p-6 text-sm text-neutral-600 shadow-sm">
            <p className="font-semibold text-neutral-800">{t("sk", "loginNeedAccess", "Potrebujete prístup?")}</p>
            <p>{t("sk", "loginNeedAccessDetail", "Požiadajte superadmina o účet a priradenie farnosti.")}</p>
          </div>
        </div>
        <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-neutral-900">
              {t("sk", "loginTitle", "Vitajte späť")}
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              {t("sk", "loginSubtitle", "Prihláste sa do správy programov.")}
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
