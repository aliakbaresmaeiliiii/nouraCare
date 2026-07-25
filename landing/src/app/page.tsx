import { redirect } from "next/navigation";

/** Static export has no middleware — send `/` to default locale. */
export default function RootPage() {
  redirect("/fa");
}
