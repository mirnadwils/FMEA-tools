import FMEAApp from '@/components/FMEAApp';

export const metadata = {
  title: 'PFMA Workshop Tool — SGO Geotechnical',
  description: 'Penilaian Likelihood, Severity, dan Detection secara kolaboratif untuk setiap failure mode dalam Preliminary FMEA workshop.',
};

export default function Home() {
  return <FMEAApp />;
}
