import { TLRSubmissionDetail } from "@/components/tlr-submission-detail";

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;

  return <TLRSubmissionDetail submissionId={submissionId} />;
}
