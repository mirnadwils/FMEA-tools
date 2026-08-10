export function buildMemberProgress(members, allFmNos, drafts) {
  const completeByMember = new Map();
  for (const draft of drafts) {
    if (draft.risk_likelihood != null && draft.negative_consequence != null) {
      if (!completeByMember.has(draft.member_id)) completeByMember.set(draft.member_id, new Set());
      completeByMember.get(draft.member_id).add(draft.fm_no);
    }
  }
  return members.map((member) => {
    const completed = completeByMember.get(member.id) || new Set();
    const completedFmNos = allFmNos.filter((fmNo) => completed.has(fmNo));
    const incompleteFmNos = allFmNos.filter((fmNo) => !completed.has(fmNo));
    return { ...member, completedFmNos, incompleteFmNos, completedCount: completedFmNos.length, totalFmCount: allFmNos.length };
  });
}
