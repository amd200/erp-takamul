// Printing for the whole app. Each module writes only its template (a function returning a PrintDoc);
// this folder turns it into a print dialog or a PDF file.
export { esc, PAPERS, renderDocument, type Paper, type PrintDoc } from "./document"
export { printDocument } from "./print"
export { downloadPdf } from "./pdf"
