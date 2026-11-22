import React, { useState } from 'react';
import {
  FARADAY_CONSTANT,
  FARADAY_PRESETS,
  MOLAR_GAS_VOLUME_25C_1BAR,
  TimeUnit,
  calculateFaraday,
  formatViNumber,
} from '../utils/faraday';
import { ChemText } from './ChemText';

export const FaradayCalculator: React.FC = () => {
  const [presetId, setPresetId] = useState<string>('cu');
  const [currentStr, setCurrentStr] = useState<string>('2');
  const [timeStr, setTimeStr] = useState<string>('965');
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('s');
  const [molarMassStr, setMolarMassStr] = useState<string>('63,5');
  const [zStr, setZStr] = useState<string>('2');
  const [isGas, setIsGas] = useState<boolean>(false);

  const selectedPreset = FARADAY_PRESETS.find((p) => p.id === presetId) ?? null;

  const handlePresetChange = (newId: string) => {
    setPresetId(newId);
    const found = FARADAY_PRESETS.find((p) => p.id === newId);
    if (found) {
      setMolarMassStr(formatViNumber(found.molarMass, { maxDecimals: 2 }));
      setZStr(String(found.z));
      setIsGas(found.isGas);
    }
  };

  const { errors, result } = calculateFaraday({
    currentStr,
    timeStr,
    timeUnit,
    molarMassStr,
    zStr,
    isGas,
  });

  const productLabel = selectedPreset ? selectedPreset.formula : 'sản phẩm';

  const unitLabelMap: Record<TimeUnit, string> = {
    s: 'giây (s)',
    min: 'phút',
    h: 'giờ',
  };

  return (
    <section aria-labelledby="faraday-calc-heading" className="space-y-6">
      <div className="border-b border-rule pb-4">
        <h2 id="faraday-calc-heading" className="text-2xl font-semibold text-ink font-serif">
          Máy tính Định luật Faraday
        </h2>
        <p className="text-base text-ink-muted mt-1.5">
          Tính từng bước điện lượng Q, số mol electron n<sub>e</sub>, số mol, khối lượng và thể tích khí (tại 25 °C, 1 bar). Chấp nhận cả dấu chấm (.) và dấu phẩy (,) thập phân.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Input Form */}
        <div className="lg:col-span-5 bg-paper-soft border border-rule p-5 space-y-5">
          <div>
            <label htmlFor="faraday-preset" className="block text-sm font-semibold text-ink mb-1.5">
              Chọn sản phẩm hoặc tự nhập M, z
            </label>
            <select
              id="faraday-preset"
              value={presetId}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 bg-paper border border-rule text-ink text-base focus:border-verdigris focus:outline-none"
            >
              {FARADAY_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} — M = {formatViNumber(p.molarMass)} g/mol, z = {p.z}
                </option>
              ))}
              <option value="custom">Tự nhập khối lượng mol M và số electron z</option>
            </select>
            {selectedPreset && (
              <p className="mt-2 text-sm text-ink-muted">
                Bán phản ứng: <strong className="text-ink font-mono"><ChemText text={selectedPreset.halfReaction} /></strong>
                <br />
                {selectedPreset.electrodeNote}.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="faraday-m" className="block text-sm font-semibold text-ink mb-1.5">
                Khối lượng mol M (g/mol)
              </label>
              <input
                id="faraday-m"
                type="text"
                inputMode="decimal"
                value={molarMassStr}
                onChange={(e) => {
                  setMolarMassStr(e.target.value);
                  if (presetId !== 'custom') setPresetId('custom');
                }}
                aria-invalid={Boolean(errors.molarMass)}
                aria-describedby={errors.molarMass ? 'faraday-m-error' : undefined}
                className={`w-full min-h-[44px] px-3 py-2 bg-paper border font-mono text-base text-ink focus:outline-none ${
                  errors.molarMass ? 'border-copper' : 'border-rule focus:border-verdigris'
                }`}
              />
              {errors.molarMass && (
                <p id="faraday-m-error" role="alert" className="mt-1.5 text-sm text-copper">
                  {errors.molarMass}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="faraday-z" className="block text-sm font-semibold text-ink mb-1.5">
                Số electron trao đổi z
              </label>
              <input
                id="faraday-z"
                type="text"
                inputMode="numeric"
                value={zStr}
                onChange={(e) => {
                  setZStr(e.target.value);
                  if (presetId !== 'custom') setPresetId('custom');
                }}
                aria-invalid={Boolean(errors.z)}
                aria-describedby={errors.z ? 'faraday-z-error' : undefined}
                className={`w-full min-h-[44px] px-3 py-2 bg-paper border font-mono text-base text-ink focus:outline-none ${
                  errors.z ? 'border-copper' : 'border-rule focus:border-verdigris'
                }`}
              />
              {errors.z && (
                <p id="faraday-z-error" role="alert" className="mt-1.5 text-sm text-copper">
                  {errors.z}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="faraday-is-gas"
              type="checkbox"
              checked={isGas}
              onChange={(e) => {
                setIsGas(e.target.checked);
                if (presetId !== 'custom') setPresetId('custom');
              }}
              className="w-5 h-5 accent-verdigris cursor-pointer"
            />
            <label htmlFor="faraday-is-gas" className="text-sm text-ink cursor-pointer">
              Sản phẩm là chất khí (tính thêm thể tích V ở 25 °C, 1 bar)
            </label>
          </div>

          <div className="pt-2 border-t border-rule space-y-4">
            <div>
              <label htmlFor="faraday-current" className="block text-sm font-semibold text-ink mb-1.5">
                Cường độ dòng điện I (A)
              </label>
              <input
                id="faraday-current"
                type="text"
                inputMode="decimal"
                value={currentStr}
                onChange={(e) => setCurrentStr(e.target.value)}
                placeholder="Ví dụ: 2 hoặc 2,5"
                aria-invalid={Boolean(errors.current)}
                aria-describedby={errors.current ? 'faraday-current-error' : undefined}
                className={`w-full min-h-[44px] px-3 py-2 bg-paper border font-mono text-base text-ink focus:outline-none ${
                  errors.current ? 'border-copper' : 'border-rule focus:border-verdigris'
                }`}
              />
              {errors.current && (
                <p id="faraday-current-error" role="alert" className="mt-1.5 text-sm text-copper">
                  {errors.current}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7">
                <label htmlFor="faraday-time" className="block text-sm font-semibold text-ink mb-1.5">
                  Thời gian điện phân t
                </label>
                <input
                  id="faraday-time"
                  type="text"
                  inputMode="decimal"
                  value={timeStr}
                  onChange={(e) => setTimeStr(e.target.value)}
                  placeholder="Ví dụ: 965"
                  aria-invalid={Boolean(errors.time)}
                  aria-describedby={errors.time ? 'faraday-time-error' : undefined}
                  className={`w-full min-h-[44px] px-3 py-2 bg-paper border font-mono text-base text-ink focus:outline-none ${
                    errors.time ? 'border-copper' : 'border-rule focus:border-verdigris'
                  }`}
                />
              </div>
              <div className="sm:col-span-5">
                <label htmlFor="faraday-time-unit" className="block text-sm font-semibold text-ink mb-1.5">
                  Đơn vị thời gian
                </label>
                <select
                  id="faraday-time-unit"
                  value={timeUnit}
                  onChange={(e) => setTimeUnit(e.target.value as TimeUnit)}
                  className="w-full min-h-[44px] px-3 py-2 bg-paper border border-rule text-ink text-base focus:border-verdigris focus:outline-none"
                >
                  <option value="s">giây (s)</option>
                  <option value="min">phút</option>
                  <option value="h">giờ</option>
                </select>
              </div>
              {errors.time && (
                <p id="faraday-time-error" role="alert" className="sm:col-span-12 text-sm text-copper">
                  {errors.time}
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-rule text-xs text-ink-muted leading-relaxed">
            <strong className="text-ink">Phạm vi áp dụng:</strong> Phép tính áp dụng cho một bán phản ứng đơn lẻ ở hiệu suất dòng 100%, với điều kiện chất ban đầu còn đủ trong suốt thời gian điện phân (F = 96 500 C/mol; V<sub>m</sub> = 24,79 L/mol tại 25 °C, 1 bar).
          </div>
        </div>

        {/* Right: Step-by-Step Solution */}
        <div className="lg:col-span-7 bg-paper-soft border border-rule p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-ink font-serif pb-3 border-b border-rule">
            Kết quả giải từng bước
          </h3>

          {!result ? (
            <div className="py-8 text-base text-ink-muted">
              Hãy sửa các giá trị báo lỗi ở cột nhập liệu bên trái để xem lời giải chi tiết. Các giá trị bạn đã nhập vẫn được giữ nguyên.
            </div>
          ) : (
            <div className="mt-5 space-y-5" data-testid="faraday-results">
              {/* Summary Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-paper border border-rule p-4">
                <div>
                  <div className="text-xs text-ink-muted">Khối lượng <ChemText text={productLabel} /></div>
                  <div className="text-2xl font-mono font-semibold text-verdigris tabular-nums mt-0.5">
                    {formatViNumber(result.massG, { maxDecimals: 5 })} g
                  </div>
                </div>
                {result.gasVolumeL !== null ? (
                  <div>
                    <div className="text-xs text-ink-muted">Thể tích khí (25 °C, 1 bar)</div>
                    <div className="text-2xl font-mono font-semibold text-copper tabular-nums mt-0.5">
                      {formatViNumber(result.gasVolumeL, { maxDecimals: 5 })} L
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs text-ink-muted">Số mol <ChemText text={productLabel} /></div>
                    <div className="text-2xl font-mono font-semibold text-ink tabular-nums mt-0.5">
                      {formatViNumber(result.productMol, { maxDecimals: 5 })} mol
                    </div>
                  </div>
                )}
              </div>

              {/* Ordered Calculation Steps */}
              <ol className="space-y-4 text-base">
                <li className="pb-3 border-b border-rule/70">
                  <div className="font-semibold text-ink text-sm">Bước 1. Đổi đơn vị thời gian sang giây</div>
                  <div className="font-mono text-ink mt-1 tabular-nums">
                    {result.timeUnit === 's' ? (
                      <>t = {formatViNumber(result.timeSeconds, { maxDecimals: 4 })} s</>
                    ) : (
                      <>
                        t = {formatViNumber(result.timeOriginal, { maxDecimals: 4 })} {unitLabelMap[result.timeUnit]} ×{' '}
                        {result.timeUnit === 'min' ? '60' : '3 600'} ={' '}
                        <strong>{formatViNumber(result.timeSeconds, { maxDecimals: 4 })} s</strong>
                      </>
                    )}
                  </div>
                </li>

                <li className="pb-3 border-b border-rule/70">
                  <div className="font-semibold text-ink text-sm">Bước 2. Tính điện lượng Q = I · t</div>
                  <div className="font-mono text-ink mt-1 tabular-nums">
                    Q = {formatViNumber(result.currentA, { maxDecimals: 4 })} ×{' '}
                    {formatViNumber(result.timeSeconds, { maxDecimals: 4 })} ={' '}
                    <strong>{formatViNumber(result.chargeC, { maxDecimals: 4 })} C</strong>
                  </div>
                </li>

                <li className="pb-3 border-b border-rule/70">
                  <div className="font-semibold text-ink text-sm">
                    Bước 3. Tính số mol electron n<sub>e</sub> = Q / F
                  </div>
                  <div className="font-mono text-ink mt-1 tabular-nums">
                    n<sub>e</sub> = {formatViNumber(result.chargeC, { maxDecimals: 4 })} /{' '}
                    {formatViNumber(FARADAY_CONSTANT)} ={' '}
                    <strong>{formatViNumber(result.electronMol, { minDecimals: 3, maxDecimals: 5 })} mol</strong>
                  </div>
                </li>

                <li className="pb-3 border-b border-rule/70">
                  <div className="font-semibold text-ink text-sm">
                    Bước 4. Tính số mol <ChemText text={productLabel} /> (n = n<sub>e</sub> / z)
                  </div>
                  <div className="font-mono text-ink mt-1 tabular-nums">
                    n = {formatViNumber(result.electronMol, { minDecimals: 3, maxDecimals: 5 })} / {result.z} ={' '}
                    <strong>{formatViNumber(result.productMol, { minDecimals: 3, maxDecimals: 5 })} mol</strong>
                  </div>
                </li>

                <li className={result.gasVolumeL !== null ? 'pb-3 border-b border-rule/70' : ''}>
                  <div className="font-semibold text-ink text-sm">
                    Bước 5. Tính khối lượng m = n · M
                  </div>
                  <div className="font-mono text-ink mt-1 tabular-nums">
                    m = {formatViNumber(result.productMol, { minDecimals: 3, maxDecimals: 5 })} ×{' '}
                    {formatViNumber(result.molarMass, { maxDecimals: 3 })} ={' '}
                    <strong>{formatViNumber(result.massG, { maxDecimals: 5 })} g</strong>
                  </div>
                </li>

                {result.gasVolumeL !== null && (
                  <li>
                    <div className="font-semibold text-ink text-sm">
                      Bước 6. Tính thể tích khí tại điều kiện chuẩn (25 °C, 1 bar)
                    </div>
                    <div className="font-mono text-ink mt-1 tabular-nums">
                      V = {formatViNumber(result.productMol, { minDecimals: 3, maxDecimals: 5 })} ×{' '}
                      {formatViNumber(MOLAR_GAS_VOLUME_25C_1BAR, { minDecimals: 2, maxDecimals: 2 })} ={' '}
                      <strong>{formatViNumber(result.gasVolumeL, { maxDecimals: 5 })} L</strong>
                    </div>
                  </li>
                )}
              </ol>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
