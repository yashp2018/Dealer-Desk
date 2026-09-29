import { parse } from 'csv-parse/sync'
import { BadRequestError } from '../../common/errors/AppError'

export interface ParsedCandidateRow {
  name: string
  city?: string
  phonePrimary?: string
  stateNormalized?: string
}

const MAX_ROWS = 1000

const HEADER_ALIASES: Record<string, keyof ParsedCandidateRow> = {
  name: 'name',
  dealer_name: 'name',
  'dealer name': 'name',
  city: 'city',
  phone: 'phonePrimary',
  phone_primary: 'phonePrimary',
  'phone number': 'phonePrimary',
  state: 'stateNormalized',
  state_normalized: 'stateNormalized',
}

/**
 * Parses an uploaded dealer list into candidate rows. CSV only — this
 * deliberately does not support .xlsx: the only maintained parser for it
 * (SheetJS's `xlsx` on npm) ships with unpatched high/critical prototype
 * pollution and ReDoS advisories, which is exactly the attack surface a
 * user-uploaded-file endpoint exposes. Exporting a spreadsheet to CSV first
 * covers the same need without that risk.
 */
export function parseDealerImportFile(buffer: Buffer): ParsedCandidateRow[] {
  let records: Record<string, string>[]
  try {
    records = parse(buffer, {
      columns: (headerRow: string[]) => headerRow.map((h) => h.trim().toLowerCase()),
      skip_empty_lines: true,
      trim: true,
      bom: true,
    })
  } catch {
    throw new BadRequestError('Could not parse the file — expected a CSV with a "name" column')
  }

  if (records.length === 0) {
    throw new BadRequestError('The file has no data rows')
  }
  if (records.length > MAX_ROWS) {
    throw new BadRequestError(`The file has ${records.length} rows — the limit is ${MAX_ROWS} per upload`)
  }

  const firstRowKeys = Object.keys(records[0])
  const hasNameColumn = firstRowKeys.some((k) => HEADER_ALIASES[k] === 'name')
  if (!hasNameColumn) {
    throw new BadRequestError('The file must have a "name" column (dealer name)')
  }

  const rows: ParsedCandidateRow[] = []
  for (const record of records) {
    const row: ParsedCandidateRow = { name: '' }
    for (const [header, value] of Object.entries(record)) {
      const field = HEADER_ALIASES[header]
      if (!field || !value) continue
      row[field] = String(value).trim().slice(0, 191)
    }
    if (row.name) rows.push(row)
  }

  return rows
}
