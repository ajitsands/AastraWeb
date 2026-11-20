import React from 'react';

/**
 * Renders a dynamic merged-cell Specification Table cleanly on both Web and PDF.
 * mode: 'web' | 'pdf'
 */
export default function SpecTableView({ table, mode = 'web', compact = false }) {
  if (!table || !Array.isArray(table.cells) || table.cells.length === 0) {
    return null;
  }

  if (mode === 'pdf') {
    return (
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          fontSize: compact ? '9px' : '9.8px',
          lineHeight: 1.25,
          fontFamily: 'Inter, Arial, sans-serif',
        }}
      >
        <tbody>
          {table.cells.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => {
                if (cell.hidden) return null;
                const Tag = cell.isHeader ? 'th' : 'td';
                return (
                  <Tag
                    key={cIdx}
                    rowSpan={cell.rowSpan > 1 ? cell.rowSpan : undefined}
                    colSpan={cell.colSpan > 1 ? cell.colSpan : undefined}
                    style={{
                      border: '1px solid #2C2C2C',
                      padding: compact ? '4px 5px 6px 5px' : '5px 6px 7px 6px',
                      textAlign: cell.align || 'center',
                      verticalAlign: 'middle',
                      fontWeight: cell.isHeader ? 700 : 500,
                      backgroundColor: cell.isHeader ? '#EBEBEB' : '#FFFFFF',
                      color: cell.isHeader ? '#161616' : '#262626',
                      wordBreak: 'break-word',
                      lineHeight: 1.2,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent:
                          cell.align === 'left'
                            ? 'flex-start'
                            : cell.align === 'right'
                            ? 'flex-end'
                            : 'center',
                        width: '100%',
                        lineHeight: 1.2,
                      }}
                    >
                      {cell.text}
                    </div>
                  </Tag>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // Web mode (supports Light & Dark themes with classic styling)
  return (
    <div className="overflow-x-auto border border-aastra-silver dark:border-neutral-700 rounded-sm">
      <table className="w-full border-collapse text-sm">
        <tbody>
          {table.cells.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => {
                if (cell.hidden) return null;
                const Tag = cell.isHeader ? 'th' : 'td';
                return (
                  <Tag
                    key={cIdx}
                    rowSpan={cell.rowSpan > 1 ? cell.rowSpan : undefined}
                    colSpan={cell.colSpan > 1 ? cell.colSpan : undefined}
                    style={{ textAlign: cell.align || 'center' }}
                    className={`border border-aastra-silver/90 dark:border-neutral-700 px-3 py-2.5 align-middle ${
                      cell.isHeader
                        ? 'bg-aastra-pearl dark:bg-neutral-800/90 font-semibold text-aastra-black dark:text-neutral-100 text-xs uppercase tracking-wider'
                        : 'bg-white dark:bg-[#181818] text-aastra-slate dark:text-neutral-300 font-mono text-xs'
                    }`}
                  >
                    {cell.text}
                  </Tag>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
