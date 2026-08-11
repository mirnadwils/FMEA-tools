import React from 'react';

export default function ReportHeader({ session, sessionCode, membership, liveResults, onPrint, readyToPrint }) {
  // English formatted generated timestamp
  const generatedAt = new Date().toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const participantCount = membership?.length || 0;
  const fmCount = session?.fmList?.length || 0;

  return (
    <div className="report-header mb-8">
      {/* Screen Controls */}
      <div className="screen-only mb-6 p-4 flex gap-4 items-center bg-gray-100 rounded-md border border-gray-200 shadow-sm">
        <a href={`/facilitator/sessions/${sessionCode}`} className="text-blue-600 hover:underline font-medium">
          &larr; Back to Dashboard
        </a>
        <div className="flex-1"></div>
        <button
          onClick={onPrint}
          disabled={!readyToPrint}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {readyToPrint ? 'Print report' : 'Preparing charts...'}
        </button>
      </div>

      {/* Cover / Metadata */}
      <div className="pb-6 border-b-2 border-gray-800">
        <h1 className="text-3xl font-bold mb-2">FMEA Workshop Report</h1>
        <h2 className="text-xl text-gray-700 font-semibold mb-4">{session?.name || 'Unnamed Workshop'}</h2>

        <div className="grid grid-cols-2 gap-4 text-sm mt-6">
          <div>
            <div className="text-gray-500 uppercase tracking-wider text-xs font-semibold">Session Code</div>
            <div className="font-medium text-lg">{sessionCode}</div>
          </div>
          <div>
            <div className="text-gray-500 uppercase tracking-wider text-xs font-semibold">Generated At</div>
            <div>{generatedAt}</div>
          </div>
          {session?.facilitatorName && (
            <div>
              <div className="text-gray-500 uppercase tracking-wider text-xs font-semibold">Facilitator</div>
              <div>{session.facilitatorName}</div>
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-8">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 min-w-[120px] report-preserve-bg">
            <div className="text-2xl font-bold text-blue-800">{fmCount}</div>
            <div className="text-sm font-medium text-gray-600">Failure Modes</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 min-w-[120px] report-preserve-bg">
            <div className="text-2xl font-bold text-blue-800">{participantCount}</div>
            <div className="text-sm font-medium text-gray-600">Participants</div>
          </div>
        </div>
      </div>
    </div>
  );
}
