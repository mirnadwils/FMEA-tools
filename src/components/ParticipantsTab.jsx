'use client';
import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { PROFESSIONAL_ROLES, EXPERIENCE_LEVELS } from '@/lib/i18n';

export default function ParticipantsTab({ members, lang }) {
  const [expandedIds, setExpandedIds] = useState(new Set());

  const toggleExpand = (id) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const getRoleLabel = (member) => {
    if (member.professional_role_key === 'other' && member.custom_role_text) {
      return member.custom_role_text;
    }
    const role = PROFESSIONAL_ROLES.find((r) => r.key === member.professional_role_key);
    return role ? role.label[lang] : member.professional_role_key;
  };

  const getExperienceLabel = (member) => {
    const exp = EXPERIENCE_LEVELS.find((e) => e.key === member.experience_level);
    return exp ? exp.label[lang] : member.experience_level;
  };

  const completedLabel = lang === 'id' ? 'FM Selesai' : 'Completed FMs';
  const incompleteLabel = lang === 'id' ? 'FM Belum Selesai' : 'Incomplete FMs';
  const noCompletedLabel = lang === 'id' ? 'Tidak ada FM yang selesai.' : 'No completed FMs.';
  const noIncompleteLabel = lang === 'id' ? 'Tidak ada FM yang belum selesai.' : 'No incomplete FMs.';

  const renderBadge = (fmNo, isCompleted) => (
    <span
      key={fmNo}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium mr-2 mb-2 ${
        isCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}
    >
      {isCompleted ? <CheckCircle2 size={12} /> : <Circle size={12} />}
      {fmNo}
    </span>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">{lang === 'id' ? 'Peserta' : 'Participants'}</h2>
      <div className="space-y-4">
        {members.map((member) => {
          const isExpanded = expandedIds.has(member.id);
          const name = member.display_name || member.email;
          const roleLabel = getRoleLabel(member);
          const expLabel = getExperienceLabel(member);

          return (
            <div key={member.id} className="border rounded-lg bg-white shadow-sm overflow-hidden">
              <button
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => toggleExpand(member.id)}
                aria-expanded={isExpanded}
                aria-label={`Toggle progress for ${name}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 flex-1">
                  <div className="font-medium text-gray-900">{name}</div>
                  <div className="text-sm text-gray-500 flex flex-wrap items-center gap-2">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{roleLabel}</span>
                    <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs">{expLabel}</span>
                  </div>
                  <div className="text-sm text-gray-500 sm:ml-auto">
                    {member.completedCount} / {member.totalFmCount} {lang === 'id' ? 'Selesai' : 'Completed'}
                  </div>
                </div>
                <div className="ml-4 text-gray-400">
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </button>
              
              {isExpanded && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <section className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">{completedLabel}</h4>
                    <div>
                      {member.completedFmNos && member.completedFmNos.length > 0
                        ? member.completedFmNos.map((fm) => renderBadge(fm, true))
                        : <p className="text-sm text-gray-500">{noCompletedLabel}</p>}
                    </div>
                  </section>
                  <section>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">{incompleteLabel}</h4>
                    <div>
                      {member.incompleteFmNos && member.incompleteFmNos.length > 0
                        ? member.incompleteFmNos.map((fm) => renderBadge(fm, false))
                        : <p className="text-sm text-gray-500">{noIncompleteLabel}</p>}
                    </div>
                  </section>
                </div>
              )}
            </div>
          );
        })}
        {members.length === 0 && (
          <p className="text-gray-500">{lang === 'id' ? 'Belum ada peserta.' : 'No participants yet.'}</p>
        )}
      </div>
    </div>
  );
}
