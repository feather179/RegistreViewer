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

          cell.appendChild(label);
          cell.appendChild(square);
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
