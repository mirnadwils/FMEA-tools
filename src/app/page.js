import FMEAApp from '@/components/FMEAApp';

export const metadata = {
  title: 'FMEA Workshop',
  description: 'Penilaian Risiko dan Peluang secara kolaboratif untuk setiap failure mode dalam Preliminary FMEA workshop.',
};

export default function Home() {
  return <FMEAApp />;
}
