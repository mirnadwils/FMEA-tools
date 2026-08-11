import { getAuthenticatedUser, requireAppRole } from '@/lib/auth';
import FacilitatorReport from './FacilitatorReport';

export default async function ReportPage({ params }) {
  // Enforce facilitator authorization boundary
  const user = await getAuthenticatedUser();
  await requireAppRole(['facilitator'], user);

  // Next.js 16 App Router requires awaiting params
  const { code } = await params;

  return (
    <FacilitatorReport sessionCode={code} />
  );
}
