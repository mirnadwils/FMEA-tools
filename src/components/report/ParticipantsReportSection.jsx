import React from 'react';

export default function ParticipantsReportSection({ membership }) {
  if (!membership || membership.length === 0) {
    return (
      <div className="report-section mb-12">
        <h2 className="text-2xl font-bold mb-6">Participants</h2>
        <p className="text-gray-600">No participants recorded.</p>
      </div>
    );
  }

  return (
    <div className="report-section mb-12">
      <h2 className="text-2xl font-bold mb-6">Participants</h2>
      
      <div className="w-full">
        <table className="w-full text-left border-collapse" style={{ fontSize: '0.875rem' }}>
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="py-2 px-3 font-semibold text-gray-700 w-[20%]">Name</th>
              <th className="py-2 px-3 font-semibold text-gray-700 w-[20%]">Email</th>
              <th className="py-2 px-3 font-semibold text-gray-700 w-[15%]">Field Work</th>
              <th className="py-2 px-3 font-semibold text-gray-700 w-[15%]">Experience</th>
              <th className="py-2 px-3 font-semibold text-gray-700 w-[10%]">Completion Count</th>
              <th className="py-2 px-3 font-semibold text-gray-700 w-[10%]">Completed FM</th>
              <th className="py-2 px-3 font-semibold text-gray-700 w-[10%]">Incomplete FM</th>
            </tr>
          </thead>
          <tbody>
            {membership.map((member) => (
              <tr key={member.memberId || member.email} className="border-b border-gray-200 report-table-row align-top">
                <td className="py-2 px-3 break-words">{member.name || '—'}</td>
                <td className="py-2 px-3 break-all">{member.email || '—'}</td>
                <td className="py-2 px-3 break-words">{member.fieldWork || '—'}</td>
                <td className="py-2 px-3 break-words">{member.experience || '—'}</td>
                <td className="py-2 px-3">{member.completedCount ?? 0}</td>
                <td className="py-2 px-3 break-words">
                  {member.completedFms && member.completedFms.length > 0
                    ? member.completedFms.join(', ')
                    : '—'}
                </td>
                <td className="py-2 px-3 break-words">
                  {member.incompleteFms && member.incompleteFms.length > 0
                    ? member.incompleteFms.join(', ')
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
