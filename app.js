class RegisterViewer {
  constructor() {
    this.value = 0n;
    this.selectedBits = new Set();
    this.lastAnchor = null;
    this._dragAnchor = null;
    this._cellDragActive = false;
    this._dragMoved = false;
    this._lastClickTime = 0;
    this._lastClickIndex = -1;
    this._formatting = false;
    this._subFormatting = false;
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
    this.subBin = document.getElementById('sub-bin');
    this.statusBar = document.getElementById('status-bar');

    this.inputEl.addEventListener('input', () => this.onInput());
    this.subInput.addEventListener('input', () => this.onSubInput());
    document.addEventListener('mouseup', () => this.onGlobalMouseUp());
    this.renderGrid();
  }

  toggleBit(index) {
    const mask = 1n << BigInt(index);
    this.value ^= mask;
  }

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

  formatHex32(val) {
    let hex = val.toString(16).toUpperCase();
    if (hex.length > 8) {
      hex = hex.padStart(Math.ceil(hex.length / 8) * 8, '0');
      const groups = [];
      for (let i = 0; i < hex.length; i += 8) {
        groups.push(hex.slice(i, i + 8));
      }
      return '0x' + groups.join(' ');
    }
    return '0x' + hex;
  }

  syncInput() {
    this.inputEl.value = this.formatHex32(this.value);
  }

  onBitMouseDown(index, event) {
    if (event.ctrlKey || event.metaKey) {
      this.toggleBit(index);
      this.syncInput();
      this.updateBitValueUI(index);
      this.updateSelectionUI();
      this.updateSubPanel();
      return;
    }
    if (event.shiftKey) {
      this.selectRange(index);
      this.updateSelectionUI();
      this.updateSubPanel();
      return;
    }

    this._dragAnchor = index;
    this._cellDragActive = true;
    this._dragMoved = false;
    this.lastAnchor = index;
    this.selectedBits.clear();
    this.selectedBits.add(index);
    this.updateSelectionUI();
    this.updateSubPanel();
  }

  onBitMouseEnter(index) {
    if (!this._cellDragActive) return;
    this._dragMoved = true;
    const start = Math.min(this._dragAnchor, index);
    const end = Math.max(this._dragAnchor, index);
    this.selectedBits.clear();
    for (let i = start; i <= end; i++) {
      this.selectedBits.add(i);
    }
    this.updateSelectionUI();
    this.updateSubPanel();
  }

  onGlobalMouseUp() {
    this._cellDragActive = false;
  }

  onBitClick(index) {
    if (this._dragMoved) return;
    const now = Date.now();
    if (now - this._lastClickTime < 350 && this._lastClickIndex === index) {
      this.toggleBit(index);
      this.syncInput();
      this.updateBitValueUI(index);
      this.updateSelectionUI();
      this.updateSubPanel();
      this._lastClickTime = 0;
      this._lastClickIndex = -1;
      return;
    }
    this._lastClickTime = now;
    this._lastClickIndex = index;
  }

  onBitKeyDown(index, event) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.selectedBits.clear();
      this.selectedBits.add(index);
      this.lastAnchor = index;
      this.renderGrid();
      this.updateSubPanel();
    }
  }

  updateBitValueUI(index) {
    const sq = this.gridEl.querySelector(`[data-index="${index}"] .bit-square`);
    if (!sq) return;
    const bitVal = (this.value >> BigInt(index)) & 1n;
    sq.dataset.value = bitVal.toString();
  }

  updateSelectionUI() {
    this.gridEl.querySelectorAll('.bit-square').forEach(sq => {
      const cell = sq.closest('.bit-cell');
      const idx = parseInt(cell.dataset.index);
      sq.classList.toggle('selected', this.selectedBits.has(idx));
    });
  }

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
    this.subHex.textContent = 'Hex: ' + this.formatHex32(subValue);
    this.subDec.textContent = `Dec: ${subValue.toString(10)}`;
    let bin = subValue.toString(2);
    if (bin.length > 8) {
      bin = bin.padStart(Math.ceil(bin.length / 8) * 8, '0');
      const groups = [];
      for (let i = 0; i < bin.length; i += 8) {
        groups.push(bin.slice(i, i + 8));
      }
      this.subBin.textContent = 'Bin: 0b' + groups.join(' ');
    } else {
      this.subBin.textContent = 'Bin: 0b' + bin;
    }
    this.subInput.value = this.formatHex32(subValue);
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

  writeSubValue(newVal) {
    const sorted = [...this.selectedBits].sort((a, b) => a - b);

    for (const pos of sorted) {
      const mask = ~(1n << BigInt(pos));
      this.value &= mask;
    }

    for (let i = 0; i < sorted.length; i++) {
      const bitVal = (newVal >> BigInt(i)) & 1n;
      if (bitVal) {
        this.value |= (1n << BigInt(sorted[i]));
      }
    }
  }

  onSubInput() {
    if (this.selectedBits.size === 0) return;
    if (this._subFormatting) return;

    try {
      const newVal = this.parseValue(this.subInput.value);

      const maxVal = (1n << BigInt(this.selectedBits.size)) - 1n;
      if (newVal > maxVal) {
        this.setStatus(`Value too large — max ${this.selectedBits.size} bits (${this.formatHex32(maxVal)})`);
        this.renderGrid();
        this.updateSubPanel();
        return;
      }

      this.writeSubValue(newVal);
      this.syncInput();
      this.renderGrid();
      this._subFormatting = true;
      this.updateSubPanel();
      this._subFormatting = false;
      this.setStatus('', false);
    } catch (e) {
      // Silently ignore — intermediate typing states are expected
    }
  }

  setStatus(msg, isError = true) {
    this.statusBar.textContent = msg;
    this.statusBar.style.color = isError ? '#f55' : '#7cff7c';
  }

  parseValue(str) {
    str = str.trim().replace(/\s+/g, '');
    if (!str) return 0n;
    let val;
    if (str.startsWith('0x') || str.startsWith('0X')) {
      val = BigInt(str);
    } else if (str.startsWith('0b') || str.startsWith('0B')) {
      val = BigInt(str);
    } else {
      val = BigInt(str);
    }
    return val & 0xFFFFFFFFFFFFFFFFn;
  }

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
          cell.tabIndex = 0;
          cell.role = 'button';

          const label = document.createElement('div');
          label.className = 'bit-index';
          label.textContent = bitIndex;

          const square = document.createElement('div');
          square.className = 'bit-square';
          square.dataset.value = bitValue.toString();
          if (this.selectedBits.has(bitIndex)) {
            square.classList.add('selected');
          }

          cell.appendChild(label);
          cell.appendChild(square);
          cell.addEventListener('mousedown', (event) => this.onBitMouseDown(bitIndex, event));
          cell.addEventListener('mouseenter', () => this.onBitMouseEnter(bitIndex));
          cell.addEventListener('click', () => this.onBitClick(bitIndex));
          cell.addEventListener('keydown', (event) => this.onBitKeyDown(bitIndex, event));
          groupEl.appendChild(cell);
        }

        rowEl.appendChild(groupEl);
      }

      this.gridEl.appendChild(rowEl);
    }
  }

  onInput() {
    if (this._formatting) return;
    const raw = this.inputEl.value;
    const isHex = /^0x/i.test(raw.trim());
    try {
      this.value = this.parseValue(raw);
      this.setStatus('', false);
    } catch (e) {
      this.setStatus('Invalid input');
      return;
    }
    this.renderGrid();
    this.clearSelection();
    this.updateSubPanel();
    if (isHex) {
      this._formatting = true;
      this.syncInput();
      this._formatting = false;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new RegisterViewer();
});
