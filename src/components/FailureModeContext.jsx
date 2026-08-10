'use client';

import React from 'react';
import { getFailureModeContextFields } from '@/lib/failure-mode-context';

export default function FailureModeContext({ fm, lang }) {
  return (
    <div className="space-y-2">
      {getFailureModeContextFields(fm, lang).map((field) => (
        <div key={field.key} className={field.highlighted
          ? 'text-sm bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800'
          : 'text-sm text-slate-600'}>
          <span className="font-bold text-slate-700">{field.label}: </span>{field.value}
        </div>
      ))}
    </div>
  );
}
