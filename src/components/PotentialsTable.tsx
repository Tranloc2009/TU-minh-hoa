import React, { useMemo, useState } from 'react';
import { ArrowUpDown, Search } from 'lucide-react';
import { STANDARD_POTENTIALS } from '../data/potentials';
import { compareElectrodeCouples, formatPotentialV } from '../utils/chemistry';
import { formatViNumber } from '../utils/faraday';
import { ChemText } from './ChemText';

export const PotentialsTable: React.FC = () => {
  const [query, setQuery] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<[string, string]>(['zn', 'cu']);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? STANDARD_POTENTIALS.filter(
          (item) =>
            item.couple.toLowerCase().includes(q) ||
            item.nameVi.toLowerCase().includes(q) ||
            item.searchTerms.toLowerCase().includes(q)
        )
      : [...STANDARD_POTENTIALS];

    return list.sort((a, b) => (sortDir === 'asc' ? a.e0 - b.e0 : b.e0 - a.e0));
  }, [query, sortDir]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev[0] === id || prev[1] === id) return prev;
      return [prev[1], id];
    });
  };

  const firstCouple =
    STANDARD_POTENTIALS.find((c) => c.id === selectedIds[0]) ?? STANDARD_POTENTIALS[7];
  const secondCouple =
    STANDARD_POTENTIALS.find((c) => c.id === selectedIds[1]) ?? STANDARD_POTENTIALS[14];

  const comparison = compareElectrodeCouples(firstCouple, secondCouple);

  return (
    <section
      aria-labelledby="potentials-table-heading"
      className="my-8 border border-rule bg-paper-soft p-5 sm:p-6"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-rule">
        <div>
          <h3 id="potentials-table-heading" className="text-xl font-semibold text-ink font-serif">
            Bảng tra thế điện cực chuẩn E° (25 °C, 1 M, 1 bar)
          </h3>
          <p className="text-sm text-ink-muted mt-1">
            Nguồn: Đề cương trang 2–3. Chọn hai cặp bất kỳ trong bảng để so sánh tính oxi hóa – khử và tính E°pin.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative">
            <label htmlFor="e0-search" className="sr-only">
              Tìm theo ký hiệu hoặc tên nguyên tố
            </label>
            <Search
              aria-hidden="true"
              className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              id="e0-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm: Zn, Cu, sắt, bạc..."
              className="w-full sm:w-56 min-h-[44px] pl-9 pr-3 py-2 text-sm bg-paper border border-rule text-ink placeholder:text-ink-muted/70 focus:border-verdigris focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            className="min-h-[44px] px-3.5 py-2 text-sm font-medium border border-rule bg-paper text-ink hover:border-verdigris hover:text-verdigris inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <ArrowUpDown className="w-4 h-4" aria-hidden="true" />
            <span>Sắp xếp E°: {sortDir === 'asc' ? 'Tăng dần' : 'Giảm dần'}</span>
          </button>
        </div>
      </div>

      {/* Side-by-side comparison box */}
      <div className="mt-5 p-4 bg-paper border border-rule">
        <div className="text-sm font-medium text-ink-muted mb-2">
          Đang so sánh hai cặp đã chọn:
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="text-base font-semibold text-ink">
              <ChemText text={comparison.anodeCouple.couple} />{' '}
              <span className="font-mono text-sm font-medium text-ink-muted tabular-nums">
                ({formatPotentialV(comparison.anodeCouple.e0)})
              </span>
            </div>
            <p className="text-sm text-ink-muted">
              E° nhỏ hơn → dạng khử <strong className="text-ink"><ChemText text={comparison.anodeCouple.reducedForm} /></strong> mạnh hơn (đóng vai trò Anode (−) trong pin).
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="text-base font-semibold text-ink">
              <ChemText text={comparison.cathodeCouple.couple} />{' '}
              <span className="font-mono text-sm font-medium text-ink-muted tabular-nums">
                ({formatPotentialV(comparison.cathodeCouple.e0)})
              </span>
            </div>
            <p className="text-sm text-ink-muted">
              E° lớn hơn → dạng oxi hóa <strong className="text-ink"><ChemText text={comparison.cathodeCouple.oxidizedForm} /></strong> mạnh hơn (đóng vai trò Cathode (+) trong pin).
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3.5 border-t border-rule grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-ink-muted block">Phản ứng tự xảy ra (quy tắc α):</span>
            <span className="font-mono font-semibold text-ink text-base">
              <ChemText text={comparison.spontaneousEquation} />
            </span>
          </div>
          <div>
            <span className="text-ink-muted block">Sức điện động chuẩn E°pin = E°cathode − E°anode:</span>
            <span className="font-mono font-semibold text-verdigris text-base tabular-nums">
              {formatViNumber(comparison.cellPotentialV, { minDecimals: 3, maxDecimals: 3 })} V
            </span>
          </div>
        </div>

        {comparison.waterWarning && (
          <p className="mt-3 pt-3 border-t border-rule text-sm text-copper">
            <ChemText text={comparison.waterWarning} />
          </p>
        )}
      </div>

      {/* Scrollable Table Wrapper */}
      <div className="mt-5 overflow-x-auto border border-rule">
        <table className="w-full min-w-[580px] text-left border-collapse text-sm">
          <thead>
            <tr className="bg-paper-muted border-b border-rule text-ink">
              <th scope="col" className="py-3 px-3.5 font-semibold">
                So sánh
              </th>
              <th scope="col" className="py-3 px-3.5 font-semibold">
                Cặp Ox/Kh
              </th>
              <th scope="col" className="py-3 px-3.5 font-semibold">
                Nguyên tố / Tên
              </th>
              <th scope="col" className="py-3 px-3.5 font-semibold">
                Bán phản ứng khử
              </th>
              <th scope="col" className="py-3 px-3.5 font-semibold text-right">
                E° (V)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule bg-paper-soft">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 px-4 text-center text-ink-muted">
                  Không tìm thấy cặp oxi hóa – khử khớp với “{query}”. Hãy thử tìm theo ký hiệu như Zn, Cu, Fe, Ag hoặc tên tiếng Việt.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const isShe = item.id === 'h2';
                return (
                  <tr
                    key={item.id}
                    className={
                      isSelected
                        ? 'bg-verdigris-tint/70'
                        : isShe
                        ? 'bg-copper-tint/50'
                        : 'hover:bg-paper/80'
                    }
                  >
                    <td className="py-2.5 px-3.5">
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(item.id)}
                        aria-pressed={isSelected}
                        aria-label={`Chọn cặp ${item.couple} để so sánh`}
                        className={`min-h-[36px] px-2.5 py-1 text-xs font-medium border cursor-pointer whitespace-nowrap transition-colors ${
                          isSelected
                            ? 'bg-verdigris text-white border-verdigris'
                            : 'bg-paper text-ink border-rule hover:border-verdigris'
                        }`}
                      >
                        {isSelected ? 'Đang chọn' : 'Chọn'}
                      </button>
                    </td>
                    <td className="py-2.5 px-3.5 font-semibold text-ink whitespace-nowrap">
                      <ChemText text={item.couple} />
                    </td>
                    <td className="py-2.5 px-3.5 text-ink">
                      {item.nameVi}
                      {isShe && (
                        <span className="block text-xs text-copper">Mốc điện cực chuẩn</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-ink whitespace-nowrap">
                      <ChemText text={item.halfReaction} />
                    </td>
                    <td className="py-2.5 px-3.5 font-mono font-semibold text-right text-ink tabular-nums whitespace-nowrap">
                      {formatPotentialV(item.e0)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
