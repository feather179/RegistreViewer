# 64-bit Register Viewer & Editor

## Overview
A standalone HTML+JS webpage for viewing and editing 64-bit register values. Users input a value (hex/dec/bin), see each bit rendered as a colored square, click bits to toggle them, select arbitrary subsets of bits, and edit the selected bits as an independent sub-value.

## File Structure
```
index.html   — page skeleton, imports CSS/JS
style.css    — dark theme, layout, bit-square styles
app.js       — all logic: parsing, rendering, interaction, selection, sub-value editing
```
Zero build dependencies. Open via local HTTP server (e.g. `python -m http.server`).

## Layout

### Bit Grid
- 2 rows × 4 byte-groups per row (8 bytes total = 64 bits)
- MSB (bit 63) leftmost → LSB (bit 0) rightmost
- Each byte group has 8 squares with 2px gap; groups separated by wider gap (~16px)
- Bit index displayed above each square

### Selection
- **Click**: select one bit, deselect all others
- **Ctrl+Click**: toggle a single bit's selection state without affecting others
- **Shift+Click**: extend selection from last anchor point to clicked bit (contiguous range)
- Selected squares get a distinct visual highlight (e.g. blue border / glow)

### Sub-value Panel
- When ≥1 bit selected, a panel shows:
  - Selected bit positions (e.g. "bits 12-15")
  - Value of selected bits in hex and decimal
  - An editable input for the sub-value
- Editing the sub-value updates only the selected bits in the full 64-bit value
- Non-contiguous selection: LSB of sub-value maps to the lowest selected bit position

## Styling (Dark Theme)
- Background: `#1a1a2e`
- Bit=1: `#7cff7c` (light green)
- Bit=0: `#444444` (gray)
- Selected: blue border/glow highlight
- Bit index label: muted white/gray small font

## Input
- Accepts hex (`0x...`), decimal, and binary (`0b...`)
- Auto-detect format by prefix (0x → hex, 0b → bin, else decimal)
- Uses JavaScript `BigInt` for 64-bit arithmetic (also handles <64-bit)
- On input parse → render grid; on grid click → update input

## Data Flow
```
Input Field → parse(value) → BigInt(value)
                              ↓
                        renderGrid(bigint)
                              ↓
                        64 bit-squares
                         ↓ (click/toggle/select)
                    updateBigInt(bitIndex, 0|1)
                              ↓
                         sync to Input Field
                         sync to Sub-value Panel
```

## Sub-value Mapping Logic
```
Given: fullValue (BigInt), selectedPositions (Set<int>)
  1. Extract sub-value: iterate selectedPositions, collect bits into a new BigInt
  2. Display sub-value in panel (hex + dec)
  3. User edits sub-value → compute new bits
  4. For each selected position, set/clear that bit in fullValue
  5. Re-render grid
```

## Edge Cases
- Empty input → all bits gray (0)
- Non-hex characters → show error message
- Value exceeds 64 bits → truncate to lower 64 bits
- No selection → sub-value panel hidden
- Single bit selected → sub-value is 0 or 1

## Testing
- Open in browser, verify hex/dec/bin input
- Verify click toggle, Ctrl+click, Shift+click selection
- Verify sub-value readout matches selected bits
- Verify editing sub-value correctly updates the 64-bit value
- Verify edge cases: empty input, invalid input, >64-bit input
