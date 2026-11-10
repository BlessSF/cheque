# Cheque Maker (React + Vite, JavaScript)

Prints payee, amount and amount-in-words onto pre-printed bank cheques.
Layout follows `FOR_CHEQUE.xlsx`: A4 landscape, payee B14 (Arial 10), amount H14 (Arial 11, centred), words B16 (Calibri 12).

## Run
    npm install
    npm run dev        # development at http://localhost:5173
    npm run build      # dist/index.html = one self-contained file, opens by double-click
    npm test           # amount-in-words / paste parsing / cheque numbering

## Use
1. Pick the bank. Each bank has its own saved layout (starts from the Excel positions).
2. Enter payee/amount, or paste rows copied from Excel (Payee, Amount, optional Date), or load a CSV.
3. "Print test page" on plain paper shows rulers and field boxes; hold it against a real cheque.
4. Drag fields (or click the preview and use arrow keys; Shift = 0.1 mm, Alt = 5 mm). Use printer nudge X/Y for feed offset.
5. "Print ticked cheques" prints one cheque per page. Set the print dialog to A4 landscape, scale 100%, no margins/headers.

Cheque numbers start at 6941334601 (Sheet2) and increase for each new cheque.
Data and layouts are stored in the browser (localStorage) on that computer.

## Layout
    src/lib/layout.js     Excel-derived default positions, field text, date formats
    src/lib/words.js      amount in words
    src/lib/parse.js      Excel paste / CSV parsing
    src/components/       Preview (drag), ChequeView (shared screen+print), PrintSheet, Panels
