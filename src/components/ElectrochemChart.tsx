import React, { useMemo, useState } from 'react';
import {
  ChartPoint,
  ElectrolysisParams,
  ElectrolysisSnapshot,
  computeElectrolysisAtTime,
  generateChartSeries,
  getDepletionTimeSeconds,
  getElectrolysisMilestones,
} from '../utils/electrochemEngine';
import { formatViNumber } from '../utils/faraday';
import { ChemText } from './ChemText';

interface ElectrochemChartProps {
  params: ElectrolysisParams;
  snapshot: ElectrolysisSnapshot;
}

type ChartMode = 'mass' | 'gas';

export const ElectrochemChart: React.FC<ElectrochemChartProps> = ({ params, snapshot }) => {
  const defaultMode: ChartMode = params.variant === 'nacl-brine' ? 'gas' : 'mass';
  const [mode, setMode] = useState<ChartMode>(defaultMode);

  // Sync chart mode when variant changes if current mode is unsupported
  const effectiveMode: ChartMode =
    params.variant === 'cuso4-copper'
      ? 'mass'
      : params.variant === 'nacl-brine'
        ? 'gas'
        : mode;

  const series = useMemo(() => generateChartSeries(params, 60), [params]);
  const depletionT = useMemo(() => getDepletionTimeSeconds(params), [params]);
  const milestones = useMemo(() => getElectrolysisMilestones(params), [params]);

  const totalT = Math.max(params.totalTimeSeconds, 1);

  // SVG plot geometry
  const width = 620;
  const height = 250;
  const padL = 62;
  const padR = 24;
  const padT = 26;
  const padB = 42;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const xScale = (t: number) =>
    padL + (params.totalTimeSeconds > 0 ? (t / params.totalTimeSeconds) * plotW : 0);

  // Compute yMax cleanly depending on variant & effectiveMode
  const yMax = useMemo(() => {
    let maxVal = 0;
    for (const p of series) {
      if (effectiveMode === 'mass') {
        if (params.variant === 'nacl-molten') {
          maxVal = Math.max(maxVal, p.naProducedG);
        } else {
          maxVal = Math.max(maxVal, p.cuPlatedG, p.cuLostAtAnodeG);
        }
      } else {
        if (params.variant === 'cuso4-inert') {
          maxVal = Math.max(maxVal, p.o2Mol, p.h2Mol);
        } else if (params.variant === 'nacl-molten') {
          maxVal = Math.max(maxVal, p.cl2Mol);
        } else {
          maxVal = Math.max(maxVal, p.h2Mol, p.cl2Mol);
        }
      }
    }
    if (maxVal <= 0) return effectiveMode === 'mass' ? 1 : 0.01;
    return maxVal * 1.15;
  }, [series, effectiveMode, params.variant]);

  const yScale = (val: number) => padT + plotH - (val / yMax) * plotH;

  const buildPath = (getter: (p: ChartPoint) => number) => {
    if (series.length === 0) return '';
    return series
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${xScale(p.t).toFixed(1)} ${yScale(getter(p)).toFixed(1)}`)
      .join(' ');
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((frac) => ({
    val: yMax * frac,
    y: padT + plotH * (1 - frac),
  }));

  const xTicks =
    params.totalTimeSeconds > 0
      ? [0, 0.25, 0.5, 0.75, 1].map((frac) => ({
          t: params.totalTimeSeconds * frac,
          x: padL + plotW * frac,
        }))
      : [{ t: 0, x: padL }];

  const showDepletionMarker =
    params.variant === 'cuso4-inert' &&
    depletionT !== null &&
    depletionT > 0 &&
    depletionT <= params.totalTimeSeconds;

  const currentX = xScale(snapshot.timeSeconds);

  // Build milestone table rows (unique sorted times including current time)
  const tableSnapshots = useMemo(() => {
    const times = milestones.map((m) => m.timeSeconds);
    const hasCurrent = times.some((t) => Math.abs(t - snapshot.timeSeconds) < 0.5);
    const merged = hasCurrent ? times : [...times, snapshot.timeSeconds];
    const sorted = Array.from(new Set(merged.map((t) => Number(t.toFixed(2))))).sort((a, b) => a - b);
    return sorted.map((t) => ({
      t,
      isCurrent: Math.abs(t - snapshot.timeSeconds) < 0.5,
      isDepletion:
        depletionT !== null && params.variant === 'cuso4-inert' && Math.abs(t - depletionT) < 0.5,
      snap: computeElectrolysisAtTime(params, t),
    }));
  }, [milestones, snapshot.timeSeconds, params, depletionT]);

  const yUnitLabel =
    effectiveMode === 'mass'
      ? params.variant === 'nacl-molten'
        ? 'm(Na) (g)'
        : 'm(Cu) (g)'
      : 'Lượng khí (mol)';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-serif text-base font-semibold text-[#F5F2EA]">
            Đồ thị diễn biến theo thời gian điện phân
          </h4>
          <p className="text-sm text-[#B7C4C7]">
            Trục hoành là thời gian thực tế trong bài toán (s). Đường đứng đứt nét màu trắng ngà biểu thị thời điểm hiện tại.
          </p>
        </div>

        {(params.variant === 'cuso4-inert' || params.variant === 'nacl-molten') && (
          <div
            role="group"
            aria-label="Chọn đại lượng biểu diễn trên đồ thị"
            className="inline-flex rounded border border-[#2A3B40] bg-[#0C1316] p-1 gap-1"
          >
            <button
              type="button"
              onClick={() => setMode('mass')}
              aria-pressed={effectiveMode === 'mass'}
              className={`min-h-[44px] px-3 text-sm font-medium rounded transition-colors cursor-pointer ${
                effectiveMode === 'mass'
                  ? 'bg-[#C77B4C] text-[#10191C] font-semibold'
                  : 'text-[#DCE4E6] hover:bg-[#19262B]'
              }`}
            >
              {params.variant === 'nacl-molten' ? 'Khối lượng Na (g)' : 'Khối lượng Cu (g)'}
            </button>
            <button
              type="button"
              onClick={() => setMode('gas')}
              aria-pressed={effectiveMode === 'gas'}
              className={`min-h-[44px] px-3 text-sm font-medium rounded transition-colors cursor-pointer ${
                effectiveMode === 'gas'
                  ? 'bg-[#78D4C4] text-[#10191C] font-semibold'
                  : 'text-[#DCE4E6] hover:bg-[#19262B]'
              }`}
            >
              Lượng khí (mol)
            </button>
          </div>
        )}
      </div>

      {/* Responsive Dark-Lab SVG Chart */}
      <div className="rounded border border-[#243439] bg-[#0C1316] p-3 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[320px] h-auto block"
          role="img"
          aria-label={`Đồ thị ${yUnitLabel} theo thời gian từ 0 đến ${formatViNumber(params.totalTimeSeconds, { maxDecimals: 1 })} giây`}
        >
          {/* Gridlines */}
          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={padL}
                y1={tick.y}
                x2={width - padR}
                y2={tick.y}
                stroke="#1E2D32"
                strokeWidth="1"
              />
              <text
                x={padL - 8}
                y={tick.y + 4}
                textAnchor="end"
                fill="#A7B7BB"
                fontSize="11"
                fontFamily="var(--font-mono)"
              >
                {formatViNumber(tick.val, {
                  maxDecimals: effectiveMode === 'mass' ? 3 : 4,
                })}
              </text>
            </g>
          ))}

          {/* Axes */}
          <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#3B5057" strokeWidth="1.2" />
          <line
            x1={padL}
            y1={padT + plotH}
            x2={width - padR}
            y2={padT + plotH}
            stroke="#3B5057"
            strokeWidth="1.2"
          />

          {/* X ticks */}
          {xTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={tick.x}
                y1={padT + plotH}
                x2={tick.x}
                y2={padT + plotH + 5}
                stroke="#3B5057"
                strokeWidth="1.2"
              />
              <text
                x={tick.x}
                y={padT + plotH + 19}
                textAnchor="middle"
                fill="#A7B7BB"
                fontSize="11"
                fontFamily="var(--font-mono)"
              >
                {formatViNumber(tick.t, { maxDecimals: 0 })}
              </text>
            </g>
          ))}

          {/* Axis Labels */}
          <text
            x={padL - 4}
            y={14}
            textAnchor="start"
            fill="#DCE4E6"
            fontSize="11.5"
            fontWeight="600"
            fontFamily="var(--font-sans)"
          >
            {yUnitLabel}
          </text>
          <text
            x={padL + plotW / 2}
            y={height - 6}
            textAnchor="middle"
            fill="#A7B7BB"
            fontSize="11.5"
            fontFamily="var(--font-sans)"
          >
            Thời gian t (s)
          </text>

          {/* Cu2+ Depletion Milestone Line */}
          {showDepletionMarker && depletionT !== null && (
            <g>
              <line
                x1={xScale(depletionT)}
                y1={padT}
                x2={xScale(depletionT)}
                y2={padT + plotH}
                stroke="#C77B4C"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
              <rect
                x={Math.min(Math.max(xScale(depletionT) - 70, padL + 4), width - padR - 144)}
                y={padT + 3}
                width="142"
                height="20"
                rx="3"
                fill="#2A1D16"
                stroke="#C77B4C"
                strokeWidth="1"
              />
              <text
                x={Math.min(Math.max(xScale(depletionT) - 70, padL + 4), width - padR - 144) + 71}
                y={padT + 16}
                textAnchor="middle"
                fill="#F5D3BE"
                fontSize="10.5"
                fontWeight="600"
                fontFamily="var(--font-sans)"
              >
                Hết Cu²⁺ ({formatViNumber(depletionT, { maxDecimals: 0 })} s)
              </text>
            </g>
          )}

          {/* Data Curves */}
          {effectiveMode === 'mass' && params.variant === 'cuso4-inert' && (
            <path
              d={buildPath((p) => p.cuPlatedG)}
              fill="none"
              stroke="#C77B4C"
              strokeWidth="2.8"
            />
          )}

          {effectiveMode === 'mass' && params.variant === 'cuso4-copper' && (
            <>
              <path
                d={buildPath((p) => p.cuPlatedG)}
                fill="none"
                stroke="#C77B4C"
                strokeWidth="2.8"
              />
              <path
                d={buildPath((p) => p.cuLostAtAnodeG)}
                fill="none"
                stroke="#78D4C4"
                strokeWidth="2"
                strokeDasharray="6 5"
              />
            </>
          )}

          {effectiveMode === 'mass' && params.variant === 'nacl-molten' && (
            <path
              d={buildPath((p) => p.naProducedG)}
              fill="none"
              stroke="#C77B4C"
              strokeWidth="2.8"
            />
          )}

          {effectiveMode === 'gas' && params.variant === 'cuso4-inert' && (
            <>
              <path
                d={buildPath((p) => p.o2Mol)}
                fill="none"
                stroke="#78D4C4"
                strokeWidth="2.6"
              />
              <path
                d={buildPath((p) => p.h2Mol)}
                fill="none"
                stroke="#F5F2EA"
                strokeWidth="2.4"
                strokeDasharray="6 4"
              />
            </>
          )}

          {effectiveMode === 'gas' && params.variant === 'nacl-molten' && (
            <path
              d={buildPath((p) => p.cl2Mol)}
              fill="none"
              stroke="#C8DF78"
              strokeWidth="2.6"
            />
          )}

          {effectiveMode === 'gas' && params.variant === 'nacl-brine' && (
            <>
              <path
                d={buildPath((p) => p.h2Mol)}
                fill="none"
                stroke="#78D4C4"
                strokeWidth="2.8"
              />
              <path
                d={buildPath((p) => p.cl2Mol)}
                fill="none"
                stroke="#C8DF78"
                strokeWidth="2.2"
                strokeDasharray="6 5"
              />
            </>
          )}

          {/* Current Time Cursor */}
          <line
            x1={currentX}
            y1={padT}
            x2={currentX}
            y2={padT + plotH}
            stroke="#F5F2EA"
            strokeWidth="1.4"
            strokeDasharray="2 3"
          />

          {/* Current Value Markers */}
          {effectiveMode === 'mass' && params.variant === 'cuso4-inert' && (
            <circle
              cx={currentX}
              cy={yScale(snapshot.cuPlatedG)}
              r="5"
              fill="#C77B4C"
              stroke="#F5F2EA"
              strokeWidth="1.8"
            />
          )}
          {effectiveMode === 'mass' && params.variant === 'cuso4-copper' && (
            <circle
              cx={currentX}
              cy={yScale(snapshot.cuPlatedG)}
              r="5"
              fill="#C77B4C"
              stroke="#F5F2EA"
              strokeWidth="1.8"
            />
          )}
          {effectiveMode === 'mass' && params.variant === 'nacl-molten' && (
            <circle
              cx={currentX}
              cy={yScale(snapshot.naProducedG)}
              r="5"
              fill="#C77B4C"
              stroke="#F5F2EA"
              strokeWidth="1.8"
            />
          )}
          {effectiveMode === 'gas' && params.variant === 'cuso4-inert' && (
            <>
              <circle
                cx={currentX}
                cy={yScale(snapshot.o2Mol)}
                r="4.5"
                fill="#78D4C4"
                stroke="#10191C"
                strokeWidth="1.5"
              />
              <circle
                cx={currentX}
                cy={yScale(snapshot.h2Mol)}
                r="4.5"
                fill="#F5F2EA"
                stroke="#10191C"
                strokeWidth="1.5"
              />
            </>
          )}
          {effectiveMode === 'gas' && params.variant === 'nacl-molten' && (
            <circle
              cx={currentX}
              cy={yScale(snapshot.cl2Mol)}
              r="4.5"
              fill="#C8DF78"
              stroke="#10191C"
              strokeWidth="1.5"
            />
          )}
          {effectiveMode === 'gas' && params.variant === 'nacl-brine' && (
            <circle
              cx={currentX}
              cy={yScale(snapshot.h2Mol)}
              r="4.5"
              fill="#78D4C4"
              stroke="#10191C"
              strokeWidth="1.5"
            />
          )}
        </svg>

        {/* Non-color-only Chart Legend */}
        <div className="mt-2 pt-2 border-t border-[#1C2A2F] flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#DCE4E6]">
          {effectiveMode === 'mass' && params.variant === 'cuso4-inert' && (
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-6 h-0.5 bg-[#C77B4C]" aria-hidden="true" />
              Nét liền đồng: Khối lượng Cu bám cathode (đi ngang sau khi hết <ChemText text="Cu²⁺" />)
            </span>
          )}
          {effectiveMode === 'mass' && params.variant === 'cuso4-copper' && (
            <>
              <span className="inline-flex items-center gap-2">
                <span className="inline-block w-6 h-0.5 bg-[#C77B4C]" aria-hidden="true" />
                Nét liền đồng: Cu bám cathode (−)
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block w-6 border-t-2 border-dashed border-[#78D4C4]"
                  aria-hidden="true"
                />
                Nét đứt ngọc: Cu tan anode (+) (trùng nhau ở hiệu suất 100%)
              </span>
            </>
          )}
          {effectiveMode === 'mass' && params.variant === 'nacl-molten' && (
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-6 h-0.5 bg-[#C77B4C]" aria-hidden="true" />
              Nét liền đồng: Khối lượng Na tạo ở cathode (−)
            </span>
          )}
          {effectiveMode === 'gas' && params.variant === 'cuso4-inert' && (
            <>
              <span className="inline-flex items-center gap-2">
                <span className="inline-block w-6 h-0.5 bg-[#78D4C4]" aria-hidden="true" />
                Nét liền ngọc: Số mol khí <ChemText text="O₂" /> (anode +, tăng liên tục)
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block w-6 border-t-2 border-dashed border-[#F5F2EA]"
                  aria-hidden="true"
                />
                Nét đứt trắng: Số mol khí <ChemText text="H₂" /> (cathode −, chỉ tăng sau mốc hết{' '}
                <ChemText text="Cu²⁺" />)
              </span>
            </>
          )}
          {effectiveMode === 'gas' && params.variant === 'nacl-molten' && (
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-6 h-0.5 bg-[#C8DF78]" aria-hidden="true" />
              Nét liền vàng lục: Số mol khí <ChemText text="Cl₂" /> (anode +)
            </span>
          )}
          {effectiveMode === 'gas' && params.variant === 'nacl-brine' && (
            <>
              <span className="inline-flex items-center gap-2">
                <span className="inline-block w-6 h-0.5 bg-[#78D4C4]" aria-hidden="true" />
                Nét liền ngọc: Số mol khí <ChemText text="H₂" /> (cathode −)
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block w-6 border-t-2 border-dashed border-[#C8DF78]"
                  aria-hidden="true"
                />
                Nét đứt vàng lục: Số mol khí <ChemText text="Cl₂" /> (anode +, bằng số mol{' '}
                <ChemText text="H₂" />)
              </span>
            </>
          )}
        </div>
      </div>

      {/* Accessible Corresponding Data Table */}
      <div className="overflow-x-auto rounded border border-[#243439] bg-[#0C1316]">
        <table className="w-full text-left text-sm border-collapse">
          <caption className="sr-only">
            Bảng số liệu tương ứng với đồ thị theo các mốc thời gian
          </caption>
          <thead>
            <tr className="border-b border-[#243439] text-xs uppercase tracking-wide text-[#9BB0B5]">
              <th className="py-2.5 px-3 font-medium">t (s)</th>
              <th className="py-2.5 px-3 font-medium">
                <ChemText text="nₑ (mol)" />
              </th>
              {params.variant === 'cuso4-inert' && (
                <>
                  <th className="py-2.5 px-3 font-medium">Cu bám (g)</th>
                  <th className="py-2.5 px-3 font-medium">
                    <ChemText text="O₂ (mol)" />
                  </th>
                  <th className="py-2.5 px-3 font-medium">
                    <ChemText text="H₂ (mol)" />
                  </th>
                  <th className="py-2.5 px-3 font-medium">
                    <ChemText text="Cu²⁺ còn (mol)" />
                  </th>
                </>
              )}
              {params.variant === 'cuso4-copper' && (
                <>
                  <th className="py-2.5 px-3 font-medium">Cu tan anode (g)</th>
                  <th className="py-2.5 px-3 font-medium">Cu bám cathode (g)</th>
                </>
              )}
              {params.variant === 'nacl-molten' && (
                <>
                  <th className="py-2.5 px-3 font-medium">Na tạo (g)</th>
                  <th className="py-2.5 px-3 font-medium">
                    <ChemText text="Cl₂ (mol)" />
                  </th>
                </>
              )}
              {params.variant === 'nacl-brine' && (
                <>
                  <th className="py-2.5 px-3 font-medium">
                    <ChemText text="H₂ (mol)" />
                  </th>
                  <th className="py-2.5 px-3 font-medium">
                    <ChemText text="Cl₂ (mol)" />
                  </th>
                  <th className="py-2.5 px-3 font-medium">
                    <ChemText text="OH⁻ / NaOH (mol)" />
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A272B] font-mono tabular-nums text-[#F5F2EA]">
            {tableSnapshots.map((row) => (
              <tr
                key={row.t}
                className={
                  row.isCurrent
                    ? 'bg-[#192D30]'
                    : row.isDepletion
                      ? 'bg-[#261B15]'
                      : ''
                }
              >
                <td className="py-2 px-3 whitespace-nowrap">
                  {formatViNumber(row.t, { maxDecimals: 1 })}
                  {row.isCurrent && (
                    <span className="ml-2 font-sans text-xs text-[#78D4C4] font-semibold">
                      (hiện tại)
                    </span>
                  )}
                  {row.isDepletion && !row.isCurrent && (
                    <span className="ml-2 font-sans text-xs text-[#E4A57B]">
                      (hết Cu²⁺)
                    </span>
                  )}
                </td>
                <td className="py-2 px-3">
                  {formatViNumber(row.snap.electronMol, { minDecimals: 4, maxDecimals: 4 })}
                </td>
                {params.variant === 'cuso4-inert' && (
                  <>
                    <td className="py-2 px-3">
                      {formatViNumber(row.snap.cuPlatedG, { minDecimals: 3, maxDecimals: 3 })}
                    </td>
                    <td className="py-2 px-3">
                      {formatViNumber(row.snap.o2Mol, { minDecimals: 4, maxDecimals: 4 })}
                    </td>
                    <td className="py-2 px-3">
                      {formatViNumber(row.snap.h2Mol, { minDecimals: 4, maxDecimals: 4 })}
                    </td>
                    <td className="py-2 px-3">
                      {formatViNumber(row.snap.cu2RemainingMol, { minDecimals: 4, maxDecimals: 4 })}
                    </td>
                  </>
                )}
                {params.variant === 'cuso4-copper' && (
                  <>
                    <td className="py-2 px-3">
                      {formatViNumber(row.snap.cuLostAtAnodeG, { minDecimals: 3, maxDecimals: 3 })}
                    </td>
                    <td className="py-2 px-3">
                      {formatViNumber(row.snap.cuPlatedG, { minDecimals: 3, maxDecimals: 3 })}
                    </td>
                  </>
                )}
                {params.variant === 'nacl-molten' && (
                  <>
                    <td className="py-2 px-3">
                      {formatViNumber(row.snap.naProducedG, { minDecimals: 3, maxDecimals: 3 })}
                    </td>
                    <td className="py-2 px-3">
                      {formatViNumber(row.snap.cl2Mol, { minDecimals: 4, maxDecimals: 4 })}
                    </td>
                  </>
                )}
                {params.variant === 'nacl-brine' && (
                  <>
                    <td className="py-2 px-3">
                      {formatViNumber(row.snap.h2Mol, { minDecimals: 4, maxDecimals: 4 })}
                    </td>
                    <td className="py-2 px-3">
                      {formatViNumber(row.snap.cl2Mol, { minDecimals: 4, maxDecimals: 4 })}
                    </td>
                    <td className="py-2 px-3">
                      {formatViNumber(row.snap.ohProducedMol, { minDecimals: 4, maxDecimals: 4 })}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
