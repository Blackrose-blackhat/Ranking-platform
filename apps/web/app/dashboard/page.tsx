import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Fetch submissions
  const { data: submissions } = await supabase
    .from("tlr_submissions")
    .select("*, institutions(name, code), tlr_scores(*)")
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch institutions count
  const { count: institutionCount } = await supabase
    .from("institutions")
    .select("*", { count: "exact", head: true });

  const latestSubmission = submissions?.[0];
  const latestScores = latestSubmission?.tlr_scores?.[0];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your NIRF ranking progress and TLR module performance.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Institutions</p>
                <p className="text-3xl font-extrabold text-foreground mt-1">{institutionCount || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Submissions</p>
                <p className="text-3xl font-extrabold text-foreground mt-1">{submissions?.length || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">TLR Score</p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  {latestScores ? `${latestScores.total_score}` : "—"}
                  <span className="text-base font-medium text-muted-foreground">/100</span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
                <div className="mt-2">
                  {latestSubmission ? (
                    <Badge variant={latestSubmission.status === "approved" ? "default" : "secondary"}>
                      {latestSubmission.status}
                    </Badge>
                  ) : (
                    <Badge variant="outline">No submissions</Badge>
                  )}
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent TLR Submissions</CardTitle>
          <Link
            href="/dashboard/tlr"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {submissions && submissions.length > 0 ? (
            <div className="divide-y divide-border">
              {submissions.map((sub: any) => (
                <Link
                  key={sub.id}
                  href={`/dashboard/tlr/${sub.id}`}
                  className="flex items-center justify-between py-4 hover:bg-accent/50 -mx-6 px-6 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {sub.institutions?.name || "Unknown Institution"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Academic Year: {sub.academic_year}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {sub.tlr_scores?.[0] && (
                      <span className="text-sm font-bold text-foreground">
                        {sub.tlr_scores[0].total_score}/100
                      </span>
                    )}
                    <Badge
                      variant={
                        sub.status === "approved"
                          ? "default"
                          : sub.status === "in_review"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {sub.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
              <Link
                href="/dashboard/tlr"
                className="inline-block mt-3 text-sm font-medium text-primary hover:underline"
              >
                Create your first TLR submission →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
