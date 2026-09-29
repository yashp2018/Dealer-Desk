import { Visit, VisitType, Staff, Dealer, Prospect, VisitAttachment } from '@prisma/client'

type VisitWithRelations = Visit & {
  visitType: VisitType
  owner: Staff
  dealer?: Dealer | null
  prospect?: Prospect | null
}

export function toVisitDto(v: VisitWithRelations) {
  return {
    id: v.id,
    ref: v.refNo,
    ref_no: v.refNo,
    dealer_id: v.dealerId,
    dealer_name: v.dealer?.name ?? '',
    visit_type: v.visitType?.name ?? '',
    title: v.title,
    scheduled_at: v.scheduledAt.toISOString(),
    status: v.status,
    outcome: v.outcome ?? null,
    outcome_note: v.outcomeNote ?? null,
    next_step: v.nextStep ?? null,
    next_at: v.nextAt ? v.nextAt.toISOString() : null,
    owner_name: v.owner?.name ?? '',
    owner_staff_id: v.ownerStaffId,
    agenda_json: v.agendaJson ? JSON.stringify(v.agendaJson) : null,
  }
}

export function toVisitAttachmentDto(a: VisitAttachment & { uploadedBy: Staff }) {
  return {
    id: a.id,
    visit_id: a.visitId,
    file_name: a.fileName,
    mime_type: a.mimeType,
    size_bytes: a.sizeBytes,
    uploaded_by_name: a.uploadedBy?.name ?? '',
    created_at: a.createdAt.toISOString(),
    // Relative to the API base — requires the same Authorization header as
    // any other API call, so callers must fetch it (not use it as a bare
    // <img src>) and render the resulting blob.
    url: `/visits/${a.visitId}/attachments/${a.id}/file`,
  }
}
