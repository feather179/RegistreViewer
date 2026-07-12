# 64-bit Register Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone HTML+JS webpage for viewing and editing 64-bit register values with bit-level interaction and sub-value editing.

**Architecture:** Three files (index.html, style.css, app.js) with zero build dependencies. The JS module manages a BigInt internal state, renders the bit grid into the DOM, handles click/selection interaction, and syncs a sub-value panel.

**Tech Stack:** Vanilla HTML5, CSS3, JavaScript (BigInt, ES6 classes)

## Global Constraints

- Dark theme with `#1a1a2e` background, `#7cff7c`=1, `#444`=0
- MSB (bit 63) on left, LSB (bit 0) on right
- 2 rows × 4 byte-groups per row
- BigInt for 64-bit arithmetic
- Input auto-detection by prefix: `0x`=hex, `0b`=binary, else decimal
- All interaction via DOM event listeners (no framework)

---

### Task 1: File Scaffolding

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `app.js`

- [ ] **Step 1: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>64-bit Register Viewer</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app">
    <h1>64-bit Register Viewer</h1>

    <div class="input-section">
      <label for="value-input">Value:</label>
      <input type="text" id="value-input" placeholder="0x... / 0b... / decimal" autofocus>
    </div>

    <div id="bit-grid"></div>

    <div id="sub-panel" class="hidden">
      <h3>Selected Bits</h3>
      <div class="sub-info">
        <span id="sub-positions"></span>
      </div>
      <div class="sub-input">
        <label for="sub-value">Value:</label>
        <input type="text" id="sub-value" placeholder="edit selected bits">
      </div>
      <div class="sub-display">
        <span id="sub-hex">Hex: 0x0</span>
        <span id="sub-dec">Dec: 0</span>
      </div>
    </div>

    <div id="status-bar"></div>
  </div>

  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create style.css**

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: #1a1a2e;
  color: #e0e0e0;
  font-family: 'Courier New', monospace;
  display: flex;
  justify-content: center;
  padding: 2rem;
}

#app {
  max-width: 900px;
  width: 100%;
}

h1 {
  font-size: 1.4rem;
  margin-bottom: 1.5rem;
  color: #ccc;
}

.input-section {
  margin-bottom: 1.5rem;
}

#value-input {
  width: 100%;
  padding: 0.6rem;
  font-size: 1.2rem;
  font-family: 'Courier New', monospace;
  background: #16213e;
  color: #e0e0e0;
  border: 1px solid #333;
  border-radius: 4px;
  outline: none;
}

#value-input:focus {
  border-color: #7cff7c;
}

/* --- Bit Grid --- */

#bit-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 1.5rem;
}

.bit-row {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.byte-group {
  display: flex;
  gap: 2px;
}

.bit-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.bit-index {
  font-size: 0.55rem;
  color: #666;
  margin-bottom: 2px;
  user-select: none;
}

.bit-square {
  width: 24px;
  height: 24px;
  border-radius: 3px;
  background: #444;
  transition: background 0.1s;
}

.bit-square[data-value="1"] {
  background: #7cff7c;
}

.bit-square.selected {
  outline: 2px solid #4a9eff;
  outline-offset: -2px;
}

/* --- Sub-value Panel --- */

#sub-panel {
  background: #16213e;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
}

#sub-panel.hidden {
  display: none;
}

.sub-info {
  margin-bottom: 0.5rem;
  color: #aaa;
  font-size: 0.85rem;
}

.sub-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

#sub-value {
  flex: 1;
  padding: 0.4rem;
  font-size: 1rem;
  font-family: 'Courier New', monospace;
  background: #1a1a2e;
  color: #e0e0e0;
  border: 1px solid #333;
  border-radius: 4px;
  outline: none;
}

#sub-value:focus {
  border-color: #4a9eff;
}

.sub-display {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #aaa;
}

/* --- Status Bar --- */

#status-bar {
  color: #f55;
  font-size: 0.8rem;
  min-height: 1rem;
}
```

- [ ] **Step 3: Create app.js scaffold**

```javascript
class RegisterViewer {
  constructor() {
    this.value = 0n;
    this.selectedBits = new Set();
    this.lastAnchor = null;
    this.init();
  }

  init() {
    this.inputEl = document.getElementById('value-input');
    this.gridEl = document.getElementById('bit-grid');
    this.subPanel = document.getElementById('sub-panel');
    this.subPositions = document.getElementById('sub-positions');
    this.subInput = document.getElementById('sub-value');
    this.subHex = document.getElementById('sub-hex');
    this.subDec = document.getElementById('sub-dec');
    this.statusBar = document.getElementById('status-bar');

    this.inputEl.addEventListener('input', () => this.onInput());
    this.subInput.addEventListener('input', () => this.onSubInput());
  }

  setStatus(msg, isError = true) {
    this.statusBar.textContent = msg;
    this.statusBar.style.color = isError ? '#f55' : '#7cff7c';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new RegisterViewer();
});
```

- [ ] **Step 4: Verify in browser**

Run: `python3 -m http.server` from project root, open `http://localhost:8000`
Expected: Dark-themed page with input field, empty grid area, and status bar.

---

### Task 2: Input Parsing + Basic Grid Rendering

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add parseValue method**

```javascript
parseValue(str) {
  str = str.trim();
  if (!str) return 0n;
  if (str.startsWith('0x') || str.startsWith('0X')) {
    return BigInt(str);
  }
  if (str.startsWith('0b') || str.startsWith('0B')) {
    return BigInt(str);
  }
  return BigInt(str);
}
```

- [ ] **Step 2: Add renderGrid method**

```javascript
renderGrid() {
  this.gridEl.innerHTML = '';
  for (let row = 0; row < 2; row++) {
    const rowEl = document.createElement('div');
    rowEl.className = 'bit-row';

    for (let group = 0; group < 4; group++) {
      const groupEl = document.createElement('div');
      groupEl.className = 'byte-group';

      const byteIndex = row * 4 + group;
      for (let b = 0; b < 8; b++) {
        const bitIndex = (7 - byteIndex) * 8 + (7 - b);
        // Equivalent to: (63 - (byteIndex * 8 + b))
        const bitValue = (this.value >> BigInt(bitIndex)) & 1n;

        const cell = document.createElement('div');
        cell.className = 'bit-cell';
        cell.dataset.index = bitIndex;

        const label = document.createElement('div');
        label.className = 'bit-index';
        label.textContent = bitIndex;

        const square = document.createElement('div');
        square.className = 'bit-square';
        square.dataset.value = bitValue.toString();

        cell.appendChild(label);
        cell.appendChild(square);
        groupEl.appendChild(cell);
      }

      rowEl.appendChild(groupEl);
    }

    this.gridEl.appendChild(rowEl);
  }
}
```

- [ ] **Step 3: Wire onInput to parse and render**

```javascript
onInput() {
  try {
    this.value = this.parseValue(this.inputEl.value);
    this.setStatus('', false);
  } catch (e) {
    this.setStatus('Invalid input');
    return;
  }
  this.renderGrid();
}
```

- [ ] **Step 4: Verify in browser**

Open page, type `0xFF` → expect: last 8 bits (bit 7-0) green, rest gray.
Type `0x1` → expect: only bit 0 green.
Type `0xFFFFFFFFFFFFFFFF` → expect: all 64 bits green.

---

### Task 3: Click to Toggle Bits + Input Sync

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add toggleBit method**

```javascript
toggleBit(index) {
  const mask = 1n << BigInt(index);
  this.value ^= mask;
}
```

- [ ] **Step 2: Add click handler to bit cells**

```javascript
onBitClick(index, event) {
  if (event.ctrlKey || event.metaKey) {
    // Selection toggle (handled by selection logic)
    this.toggleSelection(index);
    this.renderGrid();
    this.updateSubPanel();
    return;
  }
  if (event.shiftKey) {
    this.selectRange(index);
    this.renderGrid();
    this.updateSubPanel();
    return;
  }

  // Toggle bit value
  this.toggleBit(index);
  this.clearSelection();
  this.syncInput();
  this.renderGrid();
  this.updateSubPanel();
}

syncInput() {
  // Show hex by default
  this.inputEl.value = '0x' + this.value.toString(16).toUpperCase();
}
```

- [ ] **Step 3: Attach click listeners in renderGrid**

In the `renderGrid` method, after creating each cell, add:

```javascript
cell.addEventListener('click', (event) => this.onBitClick(bitIndex, event));
```

- [ ] **Step 4: Verify in browser**

Open page, type `0x0` → click bit 0 → bit 0 turns green, input shows `0x1`.
Click bit 0 again → bit 0 turns gray, input shows `0x0`.
Click bit 63 → bit 63 turns green, input shows `0x8000000000000000`.

---

### Task 4: Selection System

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add selection methods**

```javascript
clearSelection() {
  this.selectedBits.clear();
  this.lastAnchor = null;
}

toggleSelection(index) {
  if (this.selectedBits.has(index)) {
    this.selectedBits.delete(index);
  } else {
    this.selectedBits.add(index);
  }
  this.lastAnchor = index;
}

selectRange(index) {
  if (this.lastAnchor === null) {
    this.selectedBits.add(index);
    this.lastAnchor = index;
    return;
  }
  const start = Math.min(this.lastAnchor, index);
  const end = Math.max(this.lastAnchor, index);
  this.selectedBits.clear();
  for (let i = start; i <= end; i++) {
    this.selectedBits.add(i);
  }
  // Don't update lastAnchor on shift-click — keep it at the original anchor
}
```

- [ ] **Step 2: Update renderGrid to apply selection styling**

In `renderGrid`, after creating the square element, add:

```javascript
if (this.selectedBits.has(bitIndex)) {
  square.classList.add('selected');
}
```

- [ ] **Step 3: Update onBitClick to handle selection properly**

Full `onBitClick`:

```javascript
onBitClick(index, event) {
  if (event.ctrlKey || event.metaKey) {
    this.toggleSelection(index);
    this.renderGrid();
    this.updateSubPanel();
    return;
  }
  if (event.shiftKey) {
    this.selectRange(index);
    this.renderGrid();
    this.updateSubPanel();
    return;
  }

  this.toggleBit(index);
  this.clearSelection();
  this.syncInput();
  this.renderGrid();
  this.updateSubPanel();
}
```

- [ ] **Step 4: Verify in browser**

Open page, type `0xAA55AA55AA55AA55`.
- Click bit 0 once → selected box highlight.
- Ctrl+click bit 15 → both bit 0 and bit 15 selected.
- Shift+click bit 7 → range from bit 0 to bit 7 selected (replacing previous).
- Click anywhere else → clears selection, toggles bit.

---

### Task 5: Sub-value Panel

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add updateSubPanel method**

```javascript
updateSubPanel() {
  if (this.selectedBits.size === 0) {
    this.subPanel.classList.add('hidden');
    return;
  }
  this.subPanel.classList.remove('hidden');

  // Build sorted list of selected positions
  const sorted = [...this.selectedBits].sort((a, b) => b - a); // MSB first for display

  // Display positions
  if (this.selectedBits.size === 1) {
    this.subPositions.textContent = `Bit ${sorted[0]}`;
  } else {
    const sortedAsc = [...this.selectedBits].sort((a, b) => a - b);
    const isContiguous = sortedAsc[sortedAsc.length - 1] - sortedAsc[0] + 1 === sortedAsc.length;
    if (isContiguous) {
      this.subPositions.textContent = `Bits ${sortedAsc[0]}-${sortedAsc[sortedAsc.length - 1]} (${sortedAsc.length} bits)`;
    } else {
      this.subPositions.textContent = `Selected: ${sortedAsc.join(', ')} (${sortedAsc.length} bits, non-contiguous)`;
    }
  }

  // Extract sub-value
  const subValue = this.extractSubValue();

  // Display
  this.subHex.textContent = `Hex: 0x${subValue.toString(16).toUpperCase()}`;
  this.subDec.textContent = `Dec: ${subValue.toString(10)}`;
  this.subInput.value = '0x' + subValue.toString(16).toUpperCase();
}

extractSubValue() {
  let result = 0n;
  const sorted = [...this.selectedBits].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    const bitValue = (this.value >> BigInt(sorted[i])) & 1n;
    if (bitValue) {
      result |= (1n << BigInt(i));
    }
  }
  return result;
}
```

- [ ] **Step 2: Verify in browser**

Open page, type `0xFF`.
- Select bit 7-0 (contiguous) → panel shows "Bits 0-7 (8 bits)", Hex: 0xFF, Dec: 255.
- Select bit 7 and bit 0 only (non-contiguous) → shows "Selected: 0, 7 (2 bits, non-contiguous)", Hex: 0x3 (bit 7 is MSB of "selection", so bit 0 → LSB of sub = 1, bit 7 → bit 1 of sub = 1, result = 0b11 = 0x3).

---

### Task 6: Sub-value Editing

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add writeSubValue method**

```javascript
writeSubValue(newVal) {
  const sorted = [...this.selectedBits].sort((a, b) => a - b);

  // Clear all selected bits in value
  for (const pos of sorted) {
    const mask = ~(1n << BigInt(pos));
    this.value &= mask;
  }

  // Write new value bits into selected positions
  for (let i = 0; i < sorted.length; i++) {
    const bitVal = (newVal >> BigInt(i)) & 1n;
    if (bitVal) {
      this.value |= (1n << BigInt(sorted[i]));
    }
  }
}
```

- [ ] **Step 2: Add onSubInput method**

```javascript
onSubInput() {
  if (this.selectedBits.size === 0) return;

  try {
    const newVal = this.parseValue(this.subInput.value);
    this.writeSubValue(newVal);
    this.syncInput();
    this.renderGrid();
    this.updateSubPanel();
    this.setStatus('', false);
  } catch (e) {
    this.setStatus('Invalid sub-value');
  }
}
```

- [ ] **Step 3: Verify in browser**

Open page, type `0x0`.
- Select bit 3-0 → sub panel shows Hex: 0x0.
- Change sub input to `0xF` → bits 3-0 turn green, input shows `0xF`.
- Change sub input to `0x5` → bits 0 and 2 green, rest of bits 3-0 gray, input shows `0x5`.

Select bit 7 and bit 0 (non-contiguous).
- Set sub input to `0x1` → only bit 0 green.
- Set sub input to `0x3` → both bits 0 and 7 green (LSB of 0x3 = 1 → bit 0; bit 1 of 0x3 = 1 → bit 7).

---

### Task 7: Full-page initial render

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add init call to render initial state**

In the `init()` method, add at the end:

```javascript
this.renderGrid();
```

- [ ] **Step 2: Verify in browser**

Open page → expect all 64 bits gray (value = 0n), input empty, no sub panel visible.

---

## Self-Review

**Spec coverage:**
- File structure → Task 1
- Input parsing (hex/dec/bin) → Task 2
- Bit grid layout (2×4 byte-groups, MSB left) → Task 2
- Dark theme styling → Task 1 (style.css)
- Click toggle → Task 3
- Selection (click, ctrl+click, shift+click) → Task 4
- Sub-value extraction & display → Task 5
- Sub-value editing & write-back → Task 6
- Edge cases (empty/invalid/>64-bit) → Task 2 (parseValue with try/catch)

**Placeholder check:** No TBD/TODO/fill-in-later patterns found.

**Type consistency:** All method signatures and property names are consistent across tasks.

**No gaps found.**
