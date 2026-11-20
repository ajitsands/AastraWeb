import React, { useState } from 'react';
import {
  Combine,
  SplitSquareHorizontal,
  Plus,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading,
  Sparkles,
} from 'lucide-react';

function createEmptyCell(isHeader = false) {
  return {
    text: '',
    rowSpan: 1,
    colSpan: 1,
    isHeader,
    hidden: false,
    align: 'center',
  };
}

export function createBlankTable(rows = 3, cols = 6) {
  const cells = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push(createEmptyCell(r === 0));
    }
    cells.push(row);
  }
  return { rows, cols, cells };
}

// Presets matching AASTRA's brochure tables
function makePreset(type) {
  const mk = (text, rowSpan = 1, colSpan = 1, isHeader = false, hidden = false) => ({
    text,
    rowSpan,
    colSpan,
    isHeader,
    hidden,
    align: 'center',
  });

  if (type === 'material-finishes') {
    const finishes = ['Satin SS', 'Polished SS', 'Ant. Brass', 'Polish Brass', 'Satin Brass', 'Black Matt'];
    const row0 = [mk('Material', 2, 1, true), mk('Finishes', 1, 6, true)];
    for (let i = 1; i < 6; i++) row0.push(mk('', 1, 1, true, true));
    const row1 = [mk('', 1, 1, true, true), ...finishes.map((f) => mk(f, 1, 1, true))];
    const row2 = [mk('Stainless Steel'), ...finishes.map((_, i) => mk(`677.01.1${i}1`))];
    return { rows: 3, cols: 7, cells: [row0, row1, row2] };
  }

  if (type === 'dimension-finishes') {
    const finishes = ['Satin SS', 'Polished SS', 'Ant. Brass', 'Polish Brass', 'Satin Brass', 'Black Matt'];
    const row0 = [
      mk('Dimension-mm', 1, 2, true),
      mk('', 1, 1, true, true),
      mk('Finishes', 1, 6, true),
      ...Array.from({ length: 5 }, () => mk('', 1, 1, true, true)),
    ];
    const row1 = [mk('A', 1, 1, true), mk('B', 1, 1, true), ...finishes.map((f) => mk(f, 1, 1, true))];
    const row2 = [mk('50'), mk('30'), ...finishes.map((_, i) => mk(`650.01.1${i}1`))];
    const row3 = [mk('70'), mk('50'), ...finishes.map((_, i) => mk(`650.01.1${i}2`))];
    return { rows: 4, cols: 8, cells: [row0, row1, row2, row3] };
  }

  // compact
  return {
    rows: 3,
    cols: 3,
    cells: [
      [mk('Material', 1, 1, true), mk('Finishes', 1, 1, true), mk('Cat. No', 1, 1, true)],
      [mk('Stainless Steel'), mk('Satin SS'), mk('677.01.401')],
      [mk('Stainless Steel'), mk('Black Matt'), mk('677.01.451')],
    ],
  };
}

/**
 * Interactive Specification Table Builder with dynamic Rows/Cols and Cell Merging/Unmerging
 */
export default function TableBuilder({ value, onChange }) {
  const table = value && value.cells?.length ? value : createBlankTable(3, 5);
  const [selection, setSelection] = useState(null); // { r1, c1, r2, c2 }

  const updateTable = (next) => {
    onChange({
      rows: next.cells.length,
      cols: next.cells[0]?.length || 0,
      cells: next.cells,
    });
  };

  const cloneCells = () => table.cells.map((row) => row.map((c) => ({ ...c })));

  const handleCellClick = (r, c, e) => {
    const cell = table.cells[r][c];
    const endR = r + (cell.rowSpan || 1) - 1;
    const endC = c + (cell.colSpan || 1) - 1;

    if (e.shiftKey && selection) {
      setSelection({
        r1: Math.min(selection.r1, r),
        c1: Math.min(selection.c1, c),
        r2: Math.max(selection.r2, endR),
        c2: Math.max(selection.c2, endC),
      });
    } else {
      setSelection({ r1: r, c1: c, r2: endR, c2: endC });
    }
  };

  const isSelected = (r, c) => {
    if (!selection) return false;
    return r >= selection.r1 && r <= selection.r2 && c >= selection.c1 && c <= selection.c2;
  };

  const handleCellTextChange = (r, c, text) => {
    const cells = cloneCells();
    cells[r][c].text = text;
    updateTable({ cells });
  };

  const resizeTable = (newRows, newCols) => {
    const rCount = Math.max(1, Math.min(20, Number(newRows) || 1));
    const cCount = Math.max(1, Math.min(12, Number(newCols) || 1));
    const oldCells = cloneCells();
    const cells = [];

    for (let r = 0; r < rCount; r++) {
      const row = [];
      for (let c = 0; c < cCount; c++) {
        if (oldCells[r] && oldCells[r][c]) {
          const cell = { ...oldCells[r][c] };
          // Clamp spans so they never overflow new bounds
          cell.rowSpan = Math.min(cell.rowSpan || 1, rCount - r);
          cell.colSpan = Math.min(cell.colSpan || 1, cCount - c);
          row.push(cell);
        } else {
          row.push(createEmptyCell(r === 0));
        }
      }
      cells.push(row);
    }
    setSelection(null);
    updateTable({ cells });
  };

  const mergeSelected = () => {
    if (!selection) return;
    const { r1, c1, r2, c2 } = selection;
    if (r1 === r2 && c1 === c2) return;

    const cells = cloneCells();
    const mergedTexts = [];

    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        if (!cells[r][c].hidden && cells[r][c].text.trim()) {
          mergedTexts.push(cells[r][c].text.trim());
        }
        if (r === r1 && c === c1) {
          cells[r][c].rowSpan = r2 - r1 + 1;
          cells[r][c].colSpan = c2 - c1 + 1;
          cells[r][c].hidden = false;
        } else {
          cells[r][c].rowSpan = 1;
          cells[r][c].colSpan = 1;
          cells[r][c].hidden = true;
          cells[r][c].text = '';
        }
      }
    }

    cells[r1][c1].text = mergedTexts.join(' ');
    updateTable({ cells });
  };

  const unmergeSelected = () => {
    if (!selection) return;
    const { r1, c1 } = selection;
    const cells = cloneCells();
    const cell = cells[r1][c1];
    const rs = cell.rowSpan || 1;
    const cs = cell.colSpan || 1;
    if (rs === 1 && cs === 1) return;

    for (let r = r1; r < r1 + rs; r++) {
      for (let c = c1; c < c1 + cs; c++) {
        cells[r][c].rowSpan = 1;
        cells[r][c].colSpan = 1;
        cells[r][c].hidden = false;
      }
    }
    setSelection({ r1, c1, r2: r1, c2: c1 });
    updateTable({ cells });
  };

  const toggleHeaderSelected = () => {
    if (!selection) return;
    const cells = cloneCells();
    const targetVal = !cells[selection.r1][selection.c1].isHeader;
    for (let r = selection.r1; r <= selection.r2; r++) {
      for (let c = selection.c1; c <= selection.c2; c++) {
        cells[r][c].isHeader = targetVal;
      }
    }
    updateTable({ cells });
  };

  const setAlignSelected = (align) => {
    if (!selection) return;
    const cells = cloneCells();
    for (let r = selection.r1; r <= selection.r2; r++) {
      for (let c = selection.c1; c <= selection.c2; c++) {
        cells[r][c].align = align;
      }
    }
    updateTable({ cells });
  };

  return (
    <div className="space-y-3">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-aastra-pearl dark:bg-neutral-900 border border-aastra-silver dark:border-neutral-700 rounded-sm">
        {/* Dimensions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-medium text-aastra-slate dark:text-neutral-300">Rows:</span>
            <button
              type="button"
              onClick={() => resizeTable(table.rows - 1, table.cols)}
              className="p-1 border border-aastra-silver dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800 rounded"
              title="Remove row"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="number"
              min="1"
              max="20"
              value={table.rows}
              onChange={(e) => resizeTable(e.target.value, table.cols)}
              className="w-12 text-center py-1 border border-aastra-silver dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded text-xs"
            />
            <button
              type="button"
              onClick={() => resizeTable(table.rows + 1, table.cols)}
              className="p-1 border border-aastra-silver dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800 rounded"
              title="Add row"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-medium text-aastra-slate dark:text-neutral-300">Cols:</span>
            <button
              type="button"
              onClick={() => resizeTable(table.rows, table.cols - 1)}
              className="p-1 border border-aastra-silver dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800 rounded"
              title="Remove column"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="number"
              min="1"
              max="12"
              value={table.cols}
              onChange={(e) => resizeTable(table.rows, e.target.value)}
              className="w-12 text-center py-1 border border-aastra-silver dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded text-xs"
            />
            <button
              type="button"
              onClick={() => resizeTable(table.rows, table.cols + 1)}
              className="p-1 border border-aastra-silver dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800 rounded"
              title="Add column"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Cell Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={mergeSelected}
            disabled={!selection || (selection.r1 === selection.r2 && selection.c1 === selection.c2)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-aastra-black text-white dark:bg-aastra-gold dark:text-black rounded disabled:opacity-40"
            title="Shift+Click cells to select a range, then Merge"
          >
            <Combine className="w-3.5 h-3.5" /> Merge
          </button>
          <button
            type="button"
            onClick={unmergeSelected}
            disabled={!selection}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-aastra-silver dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded disabled:opacity-40"
          >
            <SplitSquareHorizontal className="w-3.5 h-3.5" /> Unmerge
          </button>
          <button
            type="button"
            onClick={toggleHeaderSelected}
            disabled={!selection}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-aastra-silver dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded disabled:opacity-40"
            title="Toggle Header Shading"
          >
            <Heading className="w-3.5 h-3.5" /> Header
          </button>
          <div className="flex border border-aastra-silver dark:border-neutral-700 rounded overflow-hidden">
            <button
              type="button"
              onClick={() => setAlignSelected('left')}
              disabled={!selection}
              className="p-1.5 bg-white dark:bg-neutral-800 hover:bg-aastra-pearl disabled:opacity-40"
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setAlignSelected('center')}
              disabled={!selection}
              className="p-1.5 bg-white dark:bg-neutral-800 hover:bg-aastra-pearl border-x border-aastra-silver dark:border-neutral-700 disabled:opacity-40"
              title="Align Center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setAlignSelected('right')}
              disabled={!selection}
              className="p-1.5 bg-white dark:bg-neutral-800 hover:bg-aastra-pearl disabled:opacity-40"
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-aastra-slate dark:text-neutral-400">
        <span className="inline-flex items-center gap-1 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-aastra-gold" /> AASTRA Presets:
        </span>
        <button
          type="button"
          onClick={() => {
            setSelection(null);
            onChange(makePreset('material-finishes'));
          }}
          className="px-2 py-1 border border-aastra-silver dark:border-neutral-700 rounded hover:border-aastra-gold transition"
        >
          Material + 6 Finishes
        </button>
        <button
          type="button"
          onClick={() => {
            setSelection(null);
            onChange(makePreset('dimension-finishes'));
          }}
          className="px-2 py-1 border border-aastra-silver dark:border-neutral-700 rounded hover:border-aastra-gold transition"
        >
          Dimension (A/B) + 6 Finishes
        </button>
        <button
          type="button"
          onClick={() => {
            setSelection(null);
            onChange(makePreset('compact'));
          }}
          className="px-2 py-1 border border-aastra-silver dark:border-neutral-700 rounded hover:border-aastra-gold transition"
        >
          Compact (Material / Finish / Cat. No)
        </button>
        <span className="ml-auto text-[11px] italic">
          Tip: Click a cell, then Shift+Click another cell to select a range and Merge.
        </span>
      </div>

      {/* Editable Grid */}
      <div className="overflow-x-auto border border-aastra-silver dark:border-neutral-700 rounded-sm">
        <table className="w-full border-collapse">
          <tbody>
            {table.cells.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => {
                  if (cell.hidden) return null;
                  const selected = isSelected(rIdx, cIdx);
                  return (
                    <td
                      key={cIdx}
                      rowSpan={cell.rowSpan > 1 ? cell.rowSpan : undefined}
                      colSpan={cell.colSpan > 1 ? cell.colSpan : undefined}
                      onClick={(e) => handleCellClick(rIdx, cIdx, e)}
                      className={`border border-aastra-silver dark:border-neutral-700 p-0 min-w-[84px] transition ${
                        cell.isHeader
                          ? 'bg-aastra-pearl dark:bg-neutral-800 font-semibold'
                          : 'bg-white dark:bg-[#171717]'
                      } ${selected ? 'ring-2 ring-inset ring-aastra-gold bg-aastra-gold/10 dark:bg-aastra-gold/15' : ''}`}
                    >
                      <input
                        type="text"
                        value={cell.text}
                        onChange={(e) => handleCellTextChange(rIdx, cIdx, e.target.value)}
                        placeholder={cell.isHeader ? 'Header' : 'Value'}
                        style={{ textAlign: cell.align || 'center' }}
                        className={`w-full px-2 py-2 bg-transparent text-xs focus:outline-none ${
                          cell.isHeader
                            ? 'font-semibold text-aastra-black dark:text-white'
                            : 'text-aastra-slate dark:text-neutral-200'
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
