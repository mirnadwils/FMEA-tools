'use client';

import { useState, useEffect } from 'react';
import { getFullSession, getMembership, getLiveResults } from '@/lib/api';
import './report.css';

import ReportHeader from '@/components/report/ReportHeader';
import ParticipantsReportSection from '@/components/report/ParticipantsReportSection';
import RiskOverviewReportSection from '@/components/report/RiskOverviewReportSection';
import LiveResultReportSection from '@/components/report/LiveResultReportSection';
import { buildReportLiveResultRows } from '@/lib/report-data';

export default function FacilitatorReport({ sessionCode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [readyToPrint, setReadyToPrint] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        const [sessionData, membershipData, liveResultsData] = await Promise.all([
          getFullSession(sessionCode),
          getMembership(sessionCode),
          getLiveResults(sessionCode)
        ]);

        if (mounted) {
          setData({
            session: sessionData,
            membership: membershipData,
            liveResults: liveResultsData
          });
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to load report data');
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [sessionCode]);

  useEffect(() => {
    if (data && !loading && !error) {
      // Wait for next frame after render to enable print button
      requestAnimationFrame(() => {
        setReadyToPrint(true);
      });
    }
  }, [data, loading, error]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8">Loading report data...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-red-600">
        <h2 className="text-xl font-bold mb-4">Access Denied / Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="report-container p-8">
      <ReportHeader 
        session={data.session}
        sessionCode={sessionCode}
        membership={data.membership}
        liveResults={data.liveResults}
        onPrint={handlePrint}
        readyToPrint={readyToPrint}
      />
      
      <div className="print-content mt-8">
        <ParticipantsReportSection membership={data.membership} />
        <RiskOverviewReportSection fmList={data.session?.fmList || []} liveResults={data.liveResults?.aggregated || []} />
        <LiveResultReportSection reportRows={buildReportLiveResultRows(data.session?.fmList || [], data.liveResults?.aggregated || [])} />
      </div>
    </div>
  );
}
