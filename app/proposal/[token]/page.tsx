import { ProposalClient } from "./proposal-client";

export const dynamic = "force-dynamic";

export default async function ProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ProposalClient token={token} />;
}
