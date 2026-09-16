/**
 * Turns a Blob (or BlobPart) response into a browser-triggered file download.
 * Mirrors sbc-auth's `auth-web` and the sibling `pay-ui` implementation:
 * create an object URL, stub a hidden anchor with the `download` attribute,
 * click it, and clean up.
 *
 * Falls back to opening in a new tab when the browser doesn't support the
 * `download` attribute (older Safari) — the browser's PDF viewer takes over.
 */
export function fileDownload(
  data: BlobPart,
  fileName: string,
  fileType = 'application/pdf'
): void {
  const blob = new Blob([data], { type: fileType })
  const blobURL = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.style.display = 'none'
  anchor.href = blobURL

  if (typeof anchor.download !== 'undefined') {
    anchor.setAttribute('download', fileName)
  } else {
    anchor.setAttribute('target', '_blank')
  }

  document.body.appendChild(anchor)
  anchor.click()
  setTimeout(() => {
    document.body.removeChild(anchor)
    window.URL.revokeObjectURL(blobURL)
  }, 200)
}

/** Formats a Date/ISO string as "MMM dd, yyyy" in Pacific time — matches the
 *  `filingDateTime` shape auth-web / pay-ui send to pay-api's /receipts. */
export function formatFilingDateTime(date: Date | string | null | undefined): string {
  if (!date) { return '' }
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.valueOf())) { return '' }
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short', day: '2-digit', year: 'numeric', timeZone: 'America/Vancouver'
  }).format(d)
}
