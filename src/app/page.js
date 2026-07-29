import FMEAApp from '@/components/FMEAApp';

export const metadata = {
  title: 'PFMA Workshop Tool — SGO Geotechnical',
  description: 'Penilaian Risiko dan Peluang (Merdeka Matrix) secara kolaboratif untuk setiap failure mode dalam Preliminary FMEA workshop.',
};

export default function Home() {
  return <FMEAApp />;
}
