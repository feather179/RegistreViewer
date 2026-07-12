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

  syncInput() {
    this.inputEl.value = '0x' + this.value.toString(16).toUpperCase();
  }

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

  setStatus(msg, isError = true) {
    this.statusBar.textContent = msg;
    this.statusBar.style.color = isError ? '#f55' : '#7cff7c';
  }

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
          if (this.selectedBits.has(bitIndex)) {
            square.classList.add('selected');
          }

          cell.appendChild(label);
          cell.appendChild(square);
          cell.addEventListener('click', (event) => this.onBitClick(bitIndex, event));
          groupEl.appendChild(cell);
        }

        rowEl.appendChild(groupEl);
      }

      this.gridEl.appendChild(rowEl);
    }
  }

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
}

document.addEventListener('DOMContentLoaded', () => {
  new RegisterViewer();
});
