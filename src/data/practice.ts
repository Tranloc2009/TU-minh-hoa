export type PracticeQuestionType = 'mcq' | 'tf' | 'numeric';

export interface PracticeQuestion {
  id: string;
  lessonNumber: number;
  lessonSlug: string;
  lessonTitle: string;
  type: PracticeQuestionType;
  prompt: string;
  options?: string[]; // for 'mcq' or 'tf'
  correctIndex?: number; // for 'mcq' or 'tf'
  numericAnswer?: number; // for 'numeric'
  tolerance?: number; // allowed absolute error for 'numeric'
  unit?: string; // e.g. "V", "g", "L", "mol"
  roundingNote?: string; // e.g. "Làm tròn đến 3 chữ số thập phân (sai số ±0,005)"
  explanation: string;
  wrongHint: string; // specific misconception explanation when answered incorrectly
  sourceLabel?: 'Đề cương' | 'Ví dụ tự luyện';
}

export interface FlashcardItem {
  id: string;
  category: string;
  front: string;
  back: string;
  tip: string;
  lessonSlug: string;
}

export const PRACTICE_QUESTIONS: PracticeQuestion[] = [
  // ==================== BÀI 1 (6 câu) ====================
  {
    id: 'b1-q1',
    lessonNumber: 1,
    lessonSlug: '1-cap-oxi-hoa-khu',
    lessonTitle: 'Bài 1: Cặp oxi hóa – khử và điện cực',
    type: 'mcq',
    prompt: 'Cách viết đúng theo quy ước của cặp oxi hóa – khử gồm ion Cu²⁺ và kim loại Cu là:',
    options: ['Cu/Cu²⁺', 'Cu²⁺/Cu', 'Cu²⁺ − Cu', 'Cu + 2e⁻/Cu²⁺'],
    correctIndex: 1,
    explanation:
      'Theo quy ước chuẩn, cặp oxi hóa – khử luôn viết dạng oxi hóa ở trước, dạng khử ở sau, ngăn cách bằng dấu gạch chéo: Cu²⁺/Cu.',
    wrongHint:
      'Bạn đã đảo thứ tự hoặc dùng sai ký hiệu phân cách. Luôn nhớ quy ước: Dạng oxi hóa (số oxi hóa cao hơn) / Dạng khử (số oxi hóa thấp hơn).',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b1-q2',
    lessonNumber: 1,
    lessonSlug: '1-cap-oxi-hoa-khu',
    lessonTitle: 'Bài 1: Cặp oxi hóa – khử và điện cực',
    type: 'mcq',
    prompt: 'Trong cặp oxi hóa – khử Fe³⁺/Fe²⁺, phát biểu nào sau đây đúng?',
    options: [
      'Fe³⁺ là dạng khử vì có số oxi hóa lớn hơn.',
      'Fe²⁺ là dạng oxi hóa vì có thể nhận thêm electron.',
      'Fe³⁺ là dạng oxi hóa và Fe²⁺ là dạng khử.',
      'Cặp Fe³⁺/Fe²⁺ không thể tạo thành một điện cực.',
    ],
    correctIndex: 2,
    explanation:
      'Trong bán phản ứng Fe³⁺ + e⁻ ⇌ Fe²⁺, Fe³⁺ nhận electron nên là dạng oxi hóa; Fe²⁺ nhường electron theo chiều nghịch nên là dạng khử. Cặp này lập được điện cực khi nhúng thanh dẫn trơ Pt vào dung dịch chứa cả Fe³⁺ và Fe²⁺.',
    wrongHint:
      'Dạng có số oxi hóa cao hơn (Fe³⁺) luôn là dạng oxi hóa (khả năng nhận e⁻ để giảm số oxi hóa xuống +2).',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b1-q3',
    lessonNumber: 1,
    lessonSlug: '1-cap-oxi-hoa-khu',
    lessonTitle: 'Bài 1: Cặp oxi hóa – khử và điện cực',
    type: 'tf',
    prompt: 'Đúng hay Sai: Trong quá trình Zn → Zn²⁺ + 2e⁻, kim loại Zn đóng vai trò là chất khử và đang bị oxi hóa.',
    options: ['Đúng', 'Sai'],
    correctIndex: 0,
    explanation:
      'Đúng. Zn nhường 2 electron (số oxi hóa tăng từ 0 lên +2) nên Zn là chất khử; quá trình nhường electron là quá trình oxi hóa (Zn bị oxi hóa).',
    wrongHint:
      'Đừng nhầm giữa "chất khử" và "quá trình khử": chất khử nhường electron nên bản thân nó bị oxi hóa (khử tăng – o giảm).',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b1-q4',
    lessonNumber: 1,
    lessonSlug: '1-cap-oxi-hoa-khu',
    lessonTitle: 'Bài 1: Cặp oxi hóa – khử và điện cực',
    type: 'mcq',
    prompt: 'Bán phản ứng nào sau đây được viết đúng và bảo toàn cả nguyên tố lẫn điện tích cho cặp Zn²⁺/Zn?',
    options: [
      'Zn²⁺ + e⁻ ⇌ Zn',
      'Zn²⁺ + 2e⁻ ⇌ Zn',
      'Zn + 2e⁻ ⇌ Zn²⁺',
      'Zn²⁺ ⇌ Zn + 2e⁻',
    ],
    correctIndex: 1,
    explanation:
      'Vế trái có điện tích (+2) + 2×(−1) = 0, bằng điện tích vế phải (0). Số nguyên tử Zn hai vế đều bằng 1.',
    wrongHint:
      'Hãy kiểm tra tổng điện tích hai vế: electron mang điện tích âm (−1) nên phải đặt ở phía có dạng oxi hóa (số oxi hóa cao hơn).',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b1-q5',
    lessonNumber: 1,
    lessonSlug: '1-cap-oxi-hoa-khu',
    lessonTitle: 'Bài 1: Cặp oxi hóa – khử và điện cực',
    type: 'numeric',
    prompt: 'Trong phản ứng Fe + 2Fe³⁺ → 3Fe²⁺, khi 1 mol Fe phản ứng hoàn toàn thì tổng số mol electron đã nhường là bao nhiêu?',
    numericAnswer: 2,
    tolerance: 0.01,
    unit: 'mol',
    roundingNote: 'Nhập số nguyên (ví dụ: 2)',
    explanation:
      'Quá trình oxi hóa: Fe → Fe²⁺ + 2e⁻. Do đó 1 mol Fe nhường đúng 2 mol electron cho 2 mol Fe³⁺ (2Fe³⁺ + 2e⁻ → 2Fe²⁺).',
    wrongHint:
      'Chú ý Fe bị oxi hóa từ số oxi hóa 0 lên +2 (nhường 2e⁻ cho mỗi nguyên tử Fe), không phải lên +3.',
    sourceLabel: 'Ví dụ tự luyện',
  },
  {
    id: 'b1-q6',
    lessonNumber: 1,
    lessonSlug: '1-cap-oxi-hoa-khu',
    lessonTitle: 'Bài 1: Cặp oxi hóa – khử và điện cực',
    type: 'tf',
    prompt: 'Đúng hay Sai: Một kim loại như sắt (Fe) chỉ có thể tham gia duy nhất một cặp oxi hóa – khử là Fe²⁺/Fe.',
    options: ['Đúng', 'Sai'],
    correctIndex: 1,
    explanation:
      'Sai. Một nguyên tố có nhiều mức oxi hóa có thể tạo nhiều cặp oxi hóa – khử khác nhau, ví dụ sắt có cặp Fe²⁺/Fe và cặp Fe³⁺/Fe²⁺.',
    wrongHint:
      'Sắt có hai ion bền phổ biến là Fe²⁺ và Fe³⁺, nên tạo ít nhất hai cặp oxi hóa – khử quan trọng trong chương 5 là Fe²⁺/Fe và Fe³⁺/Fe²⁺.',
    sourceLabel: 'Đề cương',
  },

  // ==================== BÀI 2 (6 câu) ====================
  {
    id: 'b2-q1',
    lessonNumber: 2,
    lessonSlug: '2-the-dien-cuc-chuan',
    lessonTitle: 'Bài 2: Thế điện cực chuẩn E°',
    type: 'mcq',
    prompt: 'Điện cực hydrogen chuẩn (SHE) ở 25 °C, nồng độ H⁺ 1 M và áp suất H₂ 1 bar được quy ước có thế điện cực chuẩn bằng:',
    options: ['−1,000 V', '0,000 V', '+0,340 V', '+1,000 V'],
    correctIndex: 1,
    explanation:
      'Theo quy ước quốc tế, thế điện cực chuẩn của điện cực hydrogen chuẩn E°(2H⁺/H₂) = 0,000 V làm mốc để đo thế điện cực chuẩn của các cặp khác.',
    wrongHint:
      'Điện cực hydrogen chuẩn là mốc gốc so sánh nên giá trị quy ước luôn bằng đúng 0,000 V.',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b2-q2',
    lessonNumber: 2,
    lessonSlug: '2-the-dien-cuc-chuan',
    lessonTitle: 'Bài 2: Thế điện cực chuẩn E°',
    type: 'mcq',
    prompt: 'Cho E°(Zn²⁺/Zn) = −0,763 V; E°(Fe²⁺/Fe) = −0,440 V; E°(Cu²⁺/Cu) = +0,340 V; E°(Ag⁺/Ag) = +0,799 V. Ion có tính oxi hóa mạnh nhất là:',
    options: ['Zn²⁺', 'Fe²⁺', 'Cu²⁺', 'Ag⁺'],
    correctIndex: 3,
    explanation:
      'Thế điện cực chuẩn E° càng lớn thì dạng oxi hóa có tính oxi hóa càng mạnh. Vì +0,799 V lớn nhất nên Ag⁺ có tính oxi hóa mạnh nhất.',
    wrongHint:
      'Chú ý chiều so sánh: E° lớn hơn → dạng oxi hóa mạnh hơn (dễ nhận e⁻ hơn), còn dạng khử yếu hơn.',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b2-q3',
    lessonNumber: 2,
    lessonSlug: '2-the-dien-cuc-chuan',
    lessonTitle: 'Bài 2: Thế điện cực chuẩn E°',
    type: 'mcq',
    prompt: 'Với cùng bốn cặp Zn²⁺/Zn (−0,763 V), Fe²⁺/Fe (−0,440 V), Cu²⁺/Cu (+0,340 V), Ag⁺/Ag (+0,799 V), kim loại có tính khử mạnh nhất là:',
    options: ['Zn', 'Fe', 'Cu', 'Ag'],
    correctIndex: 0,
    explanation:
      'Thế điện cực chuẩn E° càng nhỏ (càng âm) thì dạng khử có tính khử càng mạnh. Vì E°(Zn²⁺/Zn) = −0,763 V nhỏ nhất nên Zn có tính khử mạnh nhất.',
    wrongHint:
      'Nhớ dấu âm khi so sánh: −0,763 < −0,440 < +0,340 < +0,799. E° càng nhỏ thì tính khử của kim loại càng mạnh.',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b2-q4',
    lessonNumber: 2,
    lessonSlug: '2-the-dien-cuc-chuan',
    lessonTitle: 'Bài 2: Thế điện cực chuẩn E°',
    type: 'tf',
    prompt: 'Đúng hay Sai: Cặp Fe³⁺/Fe²⁺ có E° = +0,771 V đứng sau cặp Cu²⁺/Cu (E° = +0,340 V) nhưng đứng trước cặp Ag⁺/Ag (E° = +0,799 V) trong dãy thế điện cực chuẩn tăng dần.',
    options: ['Đúng', 'Sai'],
    correctIndex: 0,
    explanation:
      'Đúng. Thứ tự tăng dần của E° là: +0,340 V (Cu²⁺/Cu) < +0,771 V (Fe³⁺/Fe²⁺) < +0,799 V (Ag⁺/Ag).',
    wrongHint:
      'Hãy so sánh trực tiếp ba giá trị E°: 0,340 < 0,771 < 0,799 V. Đây là mốc rất hay gặp trong bài tập chứa đồng, sắt và bạc.',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b2-q5',
    lessonNumber: 2,
    lessonSlug: '2-the-dien-cuc-chuan',
    lessonTitle: 'Bài 2: Thế điện cực chuẩn E°',
    type: 'numeric',
    prompt: 'Dựa vào bảng thế điện cực chuẩn: E°(Cu²⁺/Cu) = +0,340 V và E°(Zn²⁺/Zn) = −0,763 V. Hiệu số E°(Cu²⁺/Cu) − E°(Zn²⁺/Zn) bằng bao nhiêu V?',
    numericAnswer: 1.103,
    tolerance: 0.005,
    unit: 'V',
    roundingNote: 'Nhập đến 3 chữ số thập phân (ví dụ: 1,103)',
    explanation:
      'Ta có: (+0,340) − (−0,763) = 0,340 + 0,763 = 1,103 V. Lưu ý trừ một số âm trở thành phép cộng.',
    wrongHint:
      'Cẩn thận dấu âm! 0,340 − (−0,763) = 0,340 + 0,763 = 1,103 V, không phải 0,340 − 0,763.',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b2-q6',
    lessonNumber: 2,
    lessonSlug: '2-the-dien-cuc-chuan',
    lessonTitle: 'Bài 2: Thế điện cực chuẩn E°',
    type: 'mcq',
    prompt: 'Điều kiện chuẩn để xác định thế điện cực chuẩn E° của một cặp oxi hóa – khử trong dung dịch là:',
    options: [
      'Nồng độ ion 0,1 M, áp suất khí 1 atm, 0 °C.',
      'Nồng độ ion 1 M, áp suất khí 1 bar, nhiệt độ 25 °C (298 K).',
      'Nồng độ ion bão hòa, áp suất khí 1 bar, 100 °C.',
      'Bất kỳ nồng độ nào miễn có mặt nước nguyên chất.',
    ],
    correctIndex: 1,
    explanation:
      'Điều kiện chuẩn theo chương trình Hóa học 12 mới là: nồng độ ion trong dung dịch bằng 1 M, áp suất khí bằng 1 bar và nhiệt độ thường xét là 25 °C (298 K).',
    wrongHint:
      'Ghi nhớ bộ 3 thông số điều kiện chuẩn mới: 1 M – 1 bar – 25 °C.',
    sourceLabel: 'Đề cương',
  },

  // ==================== BÀI 3 (6 câu) ====================
  {
    id: 'b3-q1',
    lessonNumber: 3,
    lessonSlug: '3-quy-tac-alpha',
    lessonTitle: 'Bài 3: Quy tắc α và dự đoán phản ứng',
    type: 'mcq',
    prompt: 'Theo quy tắc α, phản ứng oxi hóa – khử tự xảy ra ở điều kiện chuẩn giữa hai cặp Cu²⁺/Cu (+0,340 V) và Ag⁺/Ag (+0,799 V) là:',
    options: [
      'Cu²⁺ + 2Ag → Cu + 2Ag⁺',
      'Cu + 2Ag⁺ → Cu²⁺ + 2Ag',
      'Cu + Ag⁺ → Cu²⁺ + Ag',
      'Không xảy ra phản ứng.',
    ],
    correctIndex: 1,
    explanation:
      'E°(Cu²⁺/Cu) < E°(Ag⁺/Ag) nên dạng khử Cu phản ứng với dạng oxi hóa Ag⁺ tạo Cu²⁺ và Ag. Cân bằng điện tích: Cu + 2Ag⁺ → Cu²⁺ + 2Ag.',
    wrongHint:
      'Kiểm tra cả chiều phản ứng (chất oxi hóa mạnh hơn + chất khử mạnh hơn) lẫn cân bằng điện tích (cần hệ số 2 trước Ag⁺ và Ag).',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b3-q2',
    lessonNumber: 3,
    lessonSlug: '3-quy-tac-alpha',
    lessonTitle: 'Bài 3: Quy tắc α và dự đoán phản ứng',
    type: 'mcq',
    prompt: 'Cho bột Cu dư vào dung dịch Fe₂(SO₄)₃ (chứa Fe³⁺). Phản ứng hóa học xảy ra ở điều kiện chuẩn là:',
    options: [
      'Không phản ứng vì Cu đứng sau Fe trong dãy hoạt động.',
      '3Cu + 2Fe³⁺ → 3Cu²⁺ + 2Fe',
      'Cu + 2Fe³⁺ → Cu²⁺ + 2Fe²⁺',
      'Cu²⁺ + 2Fe²⁺ → Cu + 2Fe³⁺',
    ],
    correctIndex: 2,
    explanation:
      'Vì E°(Cu²⁺/Cu) = +0,340 V < E°(Fe³⁺/Fe²⁺) = +0,771 V nên theo quy tắc α, Cu khử được Fe³⁺ về Fe²⁺ (không về Fe vì E°(Fe²⁺/Fe) = −0,440 V < +0,340 V).',
    wrongHint:
      'Cần phân biệt hai cặp của sắt! Cu không khử được Fe²⁺ về Fe, nhưng khử được Fe³⁺ về Fe²⁺ vì +0,340 V < +0,771 V.',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b3-q3',
    lessonNumber: 3,
    lessonSlug: '3-quy-tac-alpha',
    lessonTitle: 'Bài 3: Quy tắc α và dự đoán phản ứng',
    type: 'mcq',
    prompt: 'Khi thả một mẩu kim loại Na vào dung dịch CuSO₄, hiện tượng chính xảy ra trước tiên là:',
    options: [
      'Na đẩy ngay Cu tạo lớp đồng bám dày mà không có khí thoát ra.',
      'Na phản ứng với nước tạo khí H₂ và OH⁻, sau đó Cu²⁺ kết tủa thành Cu(OH)₂ màu xanh lam.',
      'Không có phản ứng xảy ra.',
      'Chỉ tạo ra khí O₂ và kim loại Cu.',
    ],
    correctIndex: 1,
    explanation:
      'Na là kim loại kiềm hoạt động rất mạnh (E° = −2,713 V), phản ứng với nước trước: 2Na + 2H₂O → 2NaOH + H₂↑, sau đó Cu²⁺ + 2OH⁻ → Cu(OH)₂↓.',
    wrongHint:
      'Đừng áp dụng quy tắc α máy móc cho kim loại kiềm/kiềm thổ (K, Na, Ba, Ca) trong dung dịch muối: chúng tác dụng với nước trước!',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b3-q4',
    lessonNumber: 3,
    lessonSlug: '3-quy-tac-alpha',
    lessonTitle: 'Bài 3: Quy tắc α và dự đoán phản ứng',
    type: 'tf',
    prompt: 'Đúng hay Sai: Kim loại Cu không phản ứng với dung dịch HCl loãng vì E°(Cu²⁺/Cu) = +0,340 V > E°(2H⁺/H₂) = 0,000 V.',
    options: ['Đúng', 'Sai'],
    correctIndex: 0,
    explanation:
      'Đúng. Chỉ các kim loại có E°(Mⁿ⁺/M) < 0,000 V mới có dạng khử mạnh hơn H₂ và khử được H⁺ trong acid loãng (như HCl, H₂SO₄ loãng) thành khí H₂.',
    wrongHint:
      'Hãy đặt cặp 2H⁺/H₂ (0,000 V) bên trái cặp Cu²⁺/Cu (+0,340 V): theo quy tắc α, H₂ mới khử được Cu²⁺ (ở điều kiện phù hợp), chứ Cu không khử được H⁺.',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b3-q5',
    lessonNumber: 3,
    lessonSlug: '3-quy-tac-alpha',
    lessonTitle: 'Bài 3: Quy tắc α và dự đoán phản ứng',
    type: 'mcq',
    prompt: 'Khi cho dung dịch AgNO₃ dư vào dung dịch Fe(NO₃)₂, phản ứng xảy ra là:',
    options: [
      'Fe²⁺ + Ag⁺ → Fe³⁺ + Ag↓',
      'Fe²⁺ + 2Ag⁺ → Fe + 2Ag',
      'Không có phản ứng vì cả hai đều là muối.',
      'Fe³⁺ + Ag → Fe²⁺ + Ag⁺',
    ],
    correctIndex: 0,
    explanation:
      'E°(Fe³⁺/Fe²⁺) = +0,771 V < E°(Ag⁺/Ag) = +0,799 V. Theo quy tắc α, dạng khử Fe²⁺ phản ứng với dạng oxi hóa Ag⁺ tạo Fe³⁺ và kết tủa bạc Ag.',
    wrongHint:
      'So sánh E°(Fe³⁺/Fe²⁺) = +0,771 V với E°(Ag⁺/Ag) = +0,799 V: Ag⁺ có tính oxi hóa mạnh hơn Fe³⁺ nên oxi hóa được Fe²⁺ lên Fe³⁺.',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b3-q6',
    lessonNumber: 3,
    lessonSlug: '3-quy-tac-alpha',
    lessonTitle: 'Bài 3: Quy tắc α và dự đoán phản ứng',
    type: 'numeric',
    prompt: 'Cho 0,10 mol bột Zn vào dung dịch chứa 0,15 mol CuSO₄. Sau khi phản ứng xảy ra hoàn toàn, khối lượng kim loại Cu tạo thành bằng bao nhiêu gam? (Cho M(Cu) = 63,5 g/mol)',
    numericAnswer: 6.35,
    tolerance: 0.05,
    unit: 'g',
    roundingNote: 'Nhập đến 2 chữ số thập phân (ví dụ: 6,35)',
    explanation:
      'Zn + Cu²⁺ → Zn²⁺ + Cu. Vì n(Zn) = 0,10 mol < n(Cu²⁺) = 0,15 mol nên Zn hết, tính theo Zn: n(Cu) = 0,10 mol → m(Cu) = 0,10 × 63,5 = 6,35 g.',
    wrongHint:
      'Kiểm tra chất hết – chất dư: tỉ lệ mol là 1:1 nên 0,10 mol Zn chỉ tạo tối đa 0,10 mol Cu (0,05 mol Cu²⁺ còn dư).',
    sourceLabel: 'Ví dụ tự luyện',
  },

  // ==================== BÀI 4 (6 câu) ====================
  {
    id: 'b4-q1',
    lessonNumber: 4,
    lessonSlug: '4-pin-galvani',
    lessonTitle: 'Bài 4: Pin Galvani',
    type: 'mcq',
    prompt: 'Trong pin Galvani Zn–Cu hoạt động ở điều kiện chuẩn, phát biểu nào sau đây đúng?',
    options: [
      'Thanh Zn là cathode (+), thanh Cu là anode (−).',
      'Thanh Zn là anode (−), xảy ra sự oxi hóa Zn → Zn²⁺ + 2e⁻.',
      'Electron di chuyển từ thanh Cu sang thanh Zn qua dây dẫn ngoài.',
      'Khối lượng thanh Zn tăng lên còn khối lượng thanh Cu giảm đi.',
    ],
    correctIndex: 1,
    explanation:
      'Vì E°(Zn²⁺/Zn) = −0,763 V < E°(Cu²⁺/Cu) = +0,340 V nên Zn là cực âm (anode), bị oxi hóa (mòn dần); electron đi qua dây ngoài từ Zn → Cu.',
    wrongHint:
      'Trong pin Galvani, cực có E° nhỏ hơn là anode (−) nơi xảy ra oxi hóa và phát ra electron đi sang cathode (+).',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b4-q2',
    lessonNumber: 4,
    lessonSlug: '4-pin-galvani',
    lessonTitle: 'Bài 4: Pin Galvani',
    type: 'mcq',
    prompt: 'Trong pin Zn–Cu sử dụng cầu muối chứa dung dịch KNO₃ bão hòa, chiều di chuyển của các ion trong cầu muối khi pin hoạt động là:',
    options: [
      'K⁺ đi về ngăn Zn, NO₃⁻ đi về ngăn Cu.',
      'NO₃⁻ đi về ngăn Zn, K⁺ đi về ngăn Cu.',
      'Cả K⁺ và NO₃⁻ đều đi về ngăn Cu.',
      'Electron đi qua cầu muối từ ngăn Cu sang ngăn Zn.',
    ],
    correctIndex: 1,
    explanation:
      'Ngăn Zn sinh thêm Zn²⁺ (dư điện tích dương) nên anion NO₃⁻ di chuyển sang ngăn Zn để trung hòa. Ngăn Cu giảm Cu²⁺ (thiếu điện tích dương) nên cation K⁺ di chuyển sang ngăn Cu. Electron không đi trong dung dịch hay cầu muối.',
    wrongHint:
      'Nhớ quy tắc trung hòa điện tích: anion (âm) về anode (Zn), cation (dương) về cathode (Cu). Electron chỉ chạy ở dây dẫn kim loại bên ngoài.',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b4-q3',
    lessonNumber: 4,
    lessonSlug: '4-pin-galvani',
    lessonTitle: 'Bài 4: Pin Galvani',
    type: 'numeric',
    prompt: 'Tính sức điện động chuẩn E°pin của pin Galvani Cu–Ag, biết E°(Cu²⁺/Cu) = +0,340 V và E°(Ag⁺/Ag) = +0,799 V.',
    numericAnswer: 0.459,
    tolerance: 0.005,
    unit: 'V',
    roundingNote: 'Nhập đến 3 chữ số thập phân (ví dụ: 0,459)',
    explanation:
      'Cathode là Ag (+0,799 V), anode là Cu (+0,340 V). E°pin = E°cathode − E°anode = 0,799 − 0,340 = 0,459 V.',
    wrongHint:
      'Dùng đúng công thức E°pin = E°cathode − E°anode (luôn lấy số lớn trừ số nhỏ để E°pin > 0).',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b4-q4',
    lessonNumber: 4,
    lessonSlug: '4-pin-galvani',
    lessonTitle: 'Bài 4: Pin Galvani',
    type: 'tf',
    prompt: 'Đúng hay Sai: Dù ở pin Galvani hay bình điện phân, anode luôn là nơi xảy ra quá trình oxi hóa và cathode luôn là nơi xảy ra quá trình khử.',
    options: ['Đúng', 'Sai'],
    correctIndex: 0,
    explanation:
      'Đúng. Quy luật bất biến trong điện hóa: Anode – Oxi hóa, Cathode – Khử. Chỉ có dấu điện tích (+) / (−) là đảo ngược giữa pin Galvani (anode −, cathode +) và bình điện phân (anode +, cathode −).',
    wrongHint:
      'Đừng nhầm dấu cực với bản chất phản ứng! Dấu cực thay đổi giữa pin và điện phân, nhưng Anode luôn oxi hóa và Cathode luôn khử.',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b4-q5',
    lessonNumber: 4,
    lessonSlug: '4-pin-galvani',
    lessonTitle: 'Bài 4: Pin Galvani',
    type: 'mcq',
    prompt: 'Điểm khác nhau cơ bản về chuyển hóa năng lượng giữa pin Galvani và bình điện phân là:',
    options: [
      'Pin chuyển hóa điện năng thành hóa năng; bình điện phân chuyển hóa hóa năng thành điện năng.',
      'Pin chuyển hóa hóa năng thành điện năng nhờ phản ứng tự diễn biến; bình điện phân dùng điện năng gây ra phản ứng hóa học.',
      'Cả hai đều cần nguồn điện một chiều bên ngoài.',
      'Cả hai đều có anode mang điện tích âm (−).',
    ],
    correctIndex: 1,
    explanation:
      'Pin Galvani tự sinh dòng điện (hóa năng → điện năng) với anode (−) và cathode (+). Bình điện phân tiêu thụ điện từ nguồn DC ngoài (điện năng → hóa năng) với anode (+) và cathode (−).',
    wrongHint:
      'Liên hệ thực tế: cục pin phát ra điện (hóa → điện), còn bình điện phân phải cắm nguồn điện một chiều (điện → hóa).',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b4-q6',
    lessonNumber: 4,
    lessonSlug: '4-pin-galvani',
    lessonTitle: 'Bài 4: Pin Galvani',
    type: 'numeric',
    prompt: 'Tính sức điện động chuẩn E°pin của pin Fe–Cu, biết E°(Fe²⁺/Fe) = −0,440 V và E°(Cu²⁺/Cu) = +0,340 V.',
    numericAnswer: 0.78,
    tolerance: 0.005,
    unit: 'V',
    roundingNote: 'Nhập đến 2 hoặc 3 chữ số thập phân (ví dụ: 0,780)',
    explanation:
      'Anode là Fe (−0,440 V), cathode là Cu (+0,340 V). E°pin = 0,340 − (−0,440) = 0,780 V.',
    wrongHint:
      'Nhớ đổi dấu khi trừ số âm: 0,340 − (−0,440) = 0,340 + 0,440 = 0,780 V.',
    sourceLabel: 'Ví dụ tự luyện',
  },

  // ==================== BÀI 5 (6 câu) ====================
  {
    id: 'b5-q1',
    lessonNumber: 5,
    lessonSlug: '5-dien-phan',
    lessonTitle: 'Bài 5: Điện phân',
    type: 'mcq',
    prompt: 'Khi điện phân NaCl nóng chảy với điện cực trơ, sản phẩm thu được ở cathode (−) và anode (+) lần lượt là:',
    options: [
      'H₂ và Cl₂',
      'Na và Cl₂',
      'Cl₂ và Na',
      'NaOH và Cl₂',
    ],
    correctIndex: 1,
    explanation:
      'Trong hệ NaCl nóng chảy chỉ có Na⁺ và Cl⁻ (không có H₂O). Tại cathode (−): Na⁺ + e⁻ → Na. Tại anode (+): 2Cl⁻ → Cl₂↑ + 2e⁻.',
    wrongHint:
      'Phân biệt điện phân nóng chảy (không có nước, tạo kim loại Na ở cathode) với điện phân dung dịch NaCl (có nước, tạo H₂ ở cathode).',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b5-q2',
    lessonNumber: 5,
    lessonSlug: '5-dien-phan',
    lessonTitle: 'Bài 5: Điện phân',
    type: 'mcq',
    prompt: 'Khi điện phân dung dịch CuSO₄ với điện cực trơ (giai đoạn Cu²⁺ còn đủ), khí thoát ra ở anode (+) là:',
    options: ['H₂', 'SO₂', 'O₂', 'Không có khí thoát ra'],
    correctIndex: 2,
    explanation:
      'Gốc SO₄²⁻ không bị oxi hóa trong dung dịch nước, nên H₂O bị oxi hóa ở anode trơ: 2H₂O → O₂↑ + 4H⁺ + 4e⁻.',
    wrongHint:
      'Tại anode trơ, các gốc acid chứa oxygen như SO₄²⁻, NO₃⁻ không phóng điện; nước bị oxi hóa giải phóng khí O₂ và tạo H⁺.',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b5-q3',
    lessonNumber: 5,
    lessonSlug: '5-dien-phan',
    lessonTitle: 'Bài 5: Điện phân',
    type: 'mcq',
    prompt: 'Khi điện phân dung dịch CuSO₄ sử dụng anode bằng đồng (anode tan), hiện tượng xảy ra tại anode (+) là:',
    options: [
      'Nước bị oxi hóa giải phóng khí O₂.',
      'Thanh đồng anode bị oxi hóa tan dần: Cu → Cu²⁺ + 2e⁻.',
      'Đồng bám dày lên thanh anode.',
      'Ion SO₄²⁻ bị khử tạo lưu huỳnh.',
    ],
    correctIndex: 1,
    explanation:
      'Với anode tan bằng Cu, bản thân kim loại Cu ở anode dễ bị oxi hóa hơn H₂O: Cu → Cu²⁺ + 2e⁻. Lượng Cu²⁺ tan ra bù đúng lượng Cu²⁺ bị khử bám ở cathode nên nồng độ dung dịch không đổi.',
    wrongHint:
      'Khi đề bài nêu "anode bằng Cu" (điện cực không trơ), phải xét phản ứng tan của chính kim loại anode trước H₂O!',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b5-q4',
    lessonNumber: 5,
    lessonSlug: '5-dien-phan',
    lessonTitle: 'Bài 5: Điện phân',
    type: 'mcq',
    prompt: 'Sự khác biệt sản phẩm khi điện phân dung dịch NaCl bão hòa (điện cực trơ) KHÔNG có màng ngăn so với CÓ màng ngăn là:',
    options: [
      'Không có màng ngăn tạo ra nước Javel (chứa NaClO, NaCl) và H₂, không thu được riêng NaOH và Cl₂.',
      'Không có màng ngăn thu được kim loại Na.',
      'Có màng ngăn tạo ra O₂ thay vì Cl₂.',
      'Không có sự khác biệt nào về sản phẩm.',
    ],
    correctIndex: 0,
    explanation:
      'Có màng ngăn: 2NaCl + 2H₂O → 2NaOH + H₂↑ + Cl₂↑. Không có màng ngăn: Cl₂ sinh ra ở anode khuếch tán gặp OH⁻ sinh ra ở cathode: Cl₂ + 2OH⁻ → Cl⁻ + ClO⁻ + H₂O (nước Javel).',
    wrongHint:
      'Vai trò của màng ngăn xốp là ngăn Cl₂ (tại anode) tiếp xúc và phản ứng với dung dịch NaOH (tại cathode).',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b5-q5',
    lessonNumber: 5,
    lessonSlug: '5-dien-phan',
    lessonTitle: 'Bài 5: Điện phân',
    type: 'tf',
    prompt: 'Đúng hay Sai: Trong sản xuất nhôm bằng điện phân Al₂O₃ nóng chảy, cryolite (Na₃AlF₆) được thêm vào để hạ nhiệt độ nóng chảy của hỗn hợp, tăng độ dẫn điện và tạo lớp bảo vệ ngăn Al lỏng bị oxi hóa bởi không khí.',
    options: ['Đúng', 'Sai'],
    correctIndex: 0,
    explanation:
      'Đúng. Al₂O₃ nguyên chất nóng chảy ở ~2050 °C; thêm cryolite hạ xuống ~900–950 °C, giúp dẫn điện tốt hơn và lớp hỗn hợp nhẹ hơn nhôm lỏng nổi lên trên ngăn O₂ không khí.',
    wrongHint:
      'Cryolite có đủ cả ba vai trò công nghiệp rất quan trọng: hạ nhiệt độ nóng chảy, tăng độ dẫn điện và tạo lớp xỉ bảo vệ Al lỏng.',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b5-q6',
    lessonNumber: 5,
    lessonSlug: '5-dien-phan',
    lessonTitle: 'Bài 5: Điện phân',
    type: 'mcq',
    prompt: 'Điện phân dung dịch hỗn hợp chứa AgNO₃ và Cu(NO₃)₂ bằng điện cực trơ. Thứ tự bị khử tại cathode (−) là:',
    options: [
      'Cu²⁺ bị khử trước Ag⁺.',
      'H₂O bị khử trước Ag⁺ và Cu²⁺.',
      'Ag⁺ bị khử trước, sau đó đến Cu²⁺, cuối cùng mới đến H₂O.',
      'NO₃⁻ bị khử trước ở cathode.',
    ],
    correctIndex: 2,
    explanation:
      'Tại cathode, chất có tính oxi hóa mạnh hơn (E° lớn hơn) bị khử trước. Vì E°(Ag⁺/Ag) = +0,799 V > E°(Cu²⁺/Cu) = +0,340 V nên thứ tự là Ag⁺ → Cu²⁺ → H₂O.',
    wrongHint:
      'Luôn sắp xếp các cation theo E° giảm dần tại cathode: ion có E° lớn nhất (dễ nhận e⁻ nhất) phóng điện đầu tiên.',
    sourceLabel: 'Ví dụ tự luyện',
  },

  // ==================== BÀI 6 (6 câu) ====================
  {
    id: 'b6-q1',
    lessonNumber: 6,
    lessonSlug: '6-dinh-luat-faraday',
    lessonTitle: 'Bài 6: Định luật Faraday',
    type: 'numeric',
    prompt: 'Cho dòng điện không đổi I = 2 A đi qua bình điện phân trong thời gian t = 965 giây. Số mol electron nₑ đã trao đổi ở mỗi điện cực là bao nhiêu mol? (Lấy F = 96 500 C/mol)',
    numericAnswer: 0.02,
    tolerance: 0.001,
    unit: 'mol',
    roundingNote: 'Nhập đến 2 hoặc 3 chữ số thập phân (ví dụ: 0,020)',
    explanation:
      'Điện lượng Q = I · t = 2 × 965 = 1 930 C. Số mol electron nₑ = Q / F = 1 930 / 96 500 = 0,020 mol.',
    wrongHint:
      'Áp dụng công thức nₑ = (I · t) / F với I = 2 A, t = 965 s và F = 96 500 C/mol.',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b6-q2',
    lessonNumber: 6,
    lessonSlug: '6-dinh-luat-faraday',
    lessonTitle: 'Bài 6: Định luật Faraday',
    type: 'numeric',
    prompt: 'Điện phân dung dịch CuSO₄ dư (điện cực trơ) với I = 2 A trong 965 s. Khối lượng Cu bám lên cathode là bao nhiêu gam? (Lấy M(Cu) = 63,5 g/mol, F = 96 500 C/mol)',
    numericAnswer: 0.635,
    tolerance: 0.005,
    unit: 'g',
    roundingNote: 'Nhập đến 3 chữ số thập phân (ví dụ: 0,635)',
    explanation:
      'nₑ = (2 × 965) / 96 500 = 0,020 mol. Bán phản ứng: Cu²⁺ + 2e⁻ → Cu (z = 2) ⇒ n(Cu) = nₑ / 2 = 0,010 mol ⇒ m(Cu) = 0,010 × 63,5 = 0,635 g.',
    wrongHint:
      'Đừng quên chia cho z = 2 vì 1 mol Cu cần 2 mol electron (Cu²⁺ + 2e⁻ → Cu).',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b6-q3',
    lessonNumber: 6,
    lessonSlug: '6-dinh-luat-faraday',
    lessonTitle: 'Bài 6: Định luật Faraday',
    type: 'numeric',
    prompt: 'Trong cùng thí nghiệm điện phân dung dịch CuSO₄ dư với I = 2 A trong 965 s (nₑ = 0,020 mol), thể tích khí O₂ thoát ra ở anode trơ tại 25 °C, 1 bar (Vₘ = 24,79 L/mol) là bao nhiêu lít?',
    numericAnswer: 0.12395,
    tolerance: 0.002,
    unit: 'L',
    roundingNote: 'Nhập đến 3–5 chữ số thập phân (ví dụ: 0,124 hoặc 0,12395)',
    explanation:
      'Anode: 2H₂O → O₂↑ + 4H⁺ + 4e⁻ (z = 4). Suy ra n(O₂) = nₑ / 4 = 0,020 / 4 = 0,005 mol. V(O₂) = 0,005 × 24,79 = 0,12395 L ≈ 0,124 L.',
    wrongHint:
      'Chú ý 1 mol O₂ ứng với 4 mol electron (z = 4), không phải z = 2! Sau đó nhân với 24,79 L/mol ở 25 °C, 1 bar.',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b6-q4',
    lessonNumber: 6,
    lessonSlug: '6-dinh-luat-faraday',
    lessonTitle: 'Bài 6: Định luật Faraday',
    type: 'mcq',
    prompt: 'Trong công thức Faraday m = (M · I · t) / (z · F), giá trị z tương ứng với các sản phẩm Ag, Cu, Cl₂, O₂ lần lượt là:',
    options: [
      '1, 2, 1, 2',
      '1, 2, 2, 4',
      '1, 2, 2, 2',
      '2, 2, 2, 4',
    ],
    correctIndex: 1,
    explanation:
      'Theo từng bán phản ứng tạo 1 mol chất: Ag⁺ + 1e⁻ → Ag (z=1); Cu²⁺ + 2e⁻ → Cu (z=2); 2Cl⁻ → Cl₂ + 2e⁻ (z=2); 2H₂O → O₂ + 4H⁺ + 4e⁻ (z=4).',
    wrongHint:
      'z luôn tính cho 1 mol phân tử hoặc nguyên tử sản phẩm tạo thành: 1 phân tử Cl₂ cần 2e⁻, 1 phân tử O₂ cần 4e⁻.',
    sourceLabel: 'Đề cương',
  },
  {
    id: 'b6-q5',
    lessonNumber: 6,
    lessonSlug: '6-dinh-luat-faraday',
    lessonTitle: 'Bài 6: Định luật Faraday',
    type: 'numeric',
    prompt: 'Điện phân 200 mL dung dịch CuSO₄ 0,10 M (điện cực trơ) với I = 2 A trong 2 895 s (nₑ = 0,060 mol). Tổng số mol khí thoát ra ở CẢ HAI điện cực là bao nhiêu mol?',
    numericAnswer: 0.025,
    tolerance: 0.001,
    unit: 'mol',
    roundingNote: 'Nhập đến 3 chữ số thập phân (ví dụ: 0,025)',
    explanation:
      'n(Cu²⁺) = 0,2 × 0,10 = 0,020 mol → cần nₑ = 0,040 mol < 0,060 mol. Vậy tại cathode, 0,020 mol e⁻ dư khử H₂O tạo n(H₂) = 0,020 / 2 = 0,010 mol. Tại anode, H₂O bị oxi hóa suốt quá trình tạo n(O₂) = 0,060 / 4 = 0,015 mol. Tổng số mol khí = 0,010 + 0,015 = 0,025 mol.',
    wrongHint:
      'Đây là bài nhiều giai đoạn: so sánh nₑ(thực tế) = 0,060 mol với nₑ(cần cho Cu²⁺) = 0,040 mol → có thêm 0,010 mol H₂ ở cathode bên cạnh 0,015 mol O₂ ở anode!',
    sourceLabel: 'Ví dụ tự luyện',
  },
  {
    id: 'b6-q6',
    lessonNumber: 6,
    lessonSlug: '6-dinh-luat-faraday',
    lessonTitle: 'Bài 6: Định luật Faraday',
    type: 'tf',
    prompt: 'Đúng hay Sai: Khi thời gian điện phân cho bằng phút (min) hoặc giờ (h), ta bắt buộc phải đổi sang giây (s) trước khi thay vào công thức Q = I · t.',
    options: ['Đúng', 'Sai'],
    correctIndex: 0,
    explanation:
      'Đúng. Trong hệ SI, 1 Coulomb (C) = 1 Ampe (A) × 1 giây (s), nên t phải đổi về giây (1 phút = 60 s; 1 giờ = 3 600 s).',
    wrongHint:
      'Đơn vị của hằng số Faraday là C/mol (= A·s/mol), nên nếu không đổi t sang giây sẽ sai kết quả 60 lần hoặc 3 600 lần.',
    sourceLabel: 'Đề cương',
  },
];

export const FLASHCARDS: FlashcardItem[] = [
  {
    id: 'fc-1',
    category: 'Dấu điện cực',
    front: 'Dấu của Anode và Cathode trong Pin Galvani khác gì so với Bình điện phân?',
    back: 'Pin Galvani: Anode (−), Cathode (+).\nBình điện phân: Anode (+), Cathode (−).\nĐiểm giống nhau bất biến: Anode luôn xảy ra oxi hóa, Cathode luôn xảy ra khử.',
    tip: 'Nhớ nhanh: "An – Ox, Ca – Khử" luôn đúng; dấu cực của bình điện phân ngược lại với pin.',
    lessonSlug: '4-pin-galvani',
  },
  {
    id: 'fc-2',
    category: 'Chiều electron',
    front: 'Electron di chuyển theo chiều nào ở dây dẫn ngoài trong Pin Galvani và trong Bình điện phân?',
    back: 'Trong cả hai thiết bị, electron luôn rời khỏi Anode (nơi nhường e⁻) đi qua mạch ngoài về Cathode (nơi nhận e⁻).\n• Pin Zn–Cu: từ Zn (−) → Cu (+).\n• Bình điện phân: từ Anode (+) qua nguồn DC → Cathode (−).',
    tip: 'Electron chỉ chạy ở dây kim loại bên ngoài, không bao giờ bơi trong dung dịch hay cầu muối.',
    lessonSlug: '4-pin-galvani',
  },
  {
    id: 'fc-3',
    category: 'Cầu muối',
    front: 'Vai trò của cầu muối KNO₃ trong pin Zn–Cu và hướng đi của ion K⁺, NO₃⁻?',
    back: 'Cầu muối khép kín mạch điện và giữ trung hòa điện tích hai dung dịch.\n• Anion NO₃⁻ di chuyển về ngăn Anode (Zn) để bù dư Zn²⁺.\n• Cation K⁺ di chuyển về ngăn Cathode (Cu) để bù thiếu Cu²⁺.',
    tip: 'Anion về Anode, Cation về Cathode.',
    lessonSlug: '4-pin-galvani',
  },
  {
    id: 'fc-4',
    category: 'Thế điện cực chuẩn',
    front: 'Thế điện cực chuẩn E° càng lớn nói lên điều gì về dạng oxi hóa và dạng khử?',
    back: 'E° càng lớn → dạng oxi hóa càng MẠNH (dễ nhận e⁻), dạng khử càng YẾU (khó nhường e⁻).\nE° càng nhỏ → dạng khử càng MẠNH, dạng oxi hóa càng YẾU.',
    tip: 'Ví dụ: Ag⁺/Ag (+0,799 V) có Ag⁺ oxi hóa mạnh hơn Cu²⁺ (+0,340 V), nhưng Cu khử mạnh hơn Ag.',
    lessonSlug: '2-the-dien-cuc-chuan',
  },
  {
    id: 'fc-5',
    category: 'Thế điện cực chuẩn',
    front: 'Giá trị E° của điện cực hydrogen chuẩn và điều kiện chuẩn là gì?',
    back: 'E°(2H⁺/H₂) = 0,000 V tại nồng độ ion 1 M, áp suất khí 1 bar và nhiệt độ 25 °C (298 K).',
    tip: 'Kim loại có E° < 0,000 V mới đẩy được H₂ khỏi acid loãng (HCl, H₂SO₄ loãng).',
    lessonSlug: '2-the-dien-cuc-chuan',
  },
  {
    id: 'fc-6',
    category: 'Quy tắc α',
    front: 'Phát biểu ngắn gọn Quy tắc α và ngoại lệ cần chú ý trong dung dịch nước.',
    back: 'Đặt cặp có E° nhỏ hơn bên trái, E° lớn hơn bên phải: dạng khử mạnh (dưới trái) + dạng oxi hóa mạnh (trên phải) → dạng oxi hóa yếu + dạng khử yếu.\nNgoại lệ: K, Ba, Ca, Na phản ứng với H₂O trước tạo OH⁻ và H₂.',
    tip: 'Ví dụ kinh điển: Cu + 2Fe³⁺ → Cu²⁺ + 2Fe²⁺ (+0,340 V < +0,771 V).',
    lessonSlug: '3-quy-tac-alpha',
  },
  {
    id: 'fc-7',
    category: 'Sức điện động pin',
    front: 'Công thức tính E°pin và hai giá trị mẫu Zn–Cu, Cu–Ag trong đề cương?',
    back: 'E°pin = E°cathode − E°anode (dùng thế khử chuẩn).\n• Pin Zn–Cu: +0,340 − (−0,763) = 1,103 V.\n• Pin Cu–Ag: +0,799 − (+0,340) = 0,459 V.',
    tip: 'Sức điện động pin luôn dương (> 0 V). Nhớ cẩn thận dấu trừ trước số âm!',
    lessonSlug: '4-pin-galvani',
  },
  {
    id: 'fc-8',
    category: 'Điện phân nóng chảy',
    front: 'Bán phản ứng và phương trình điện phân NaCl nóng chảy?',
    back: '• Cathode (−): Na⁺ + e⁻ → Na\n• Anode (+): 2Cl⁻ → Cl₂↑ + 2e⁻\n• Tổng: 2NaCl —đpnc→ 2Na + Cl₂↑.',
    tip: 'Hệ nóng chảy không có nước nên không bao giờ sinh H₂ hay O₂.',
    lessonSlug: '5-dien-phan',
  },
  {
    id: 'fc-9',
    category: 'Điện phân dung dịch',
    front: 'So sánh điện phân dung dịch CuSO₄ với điện cực trơ và với anode Cu.',
    back: '• Điện cực trơ: Cathode có Cu bám (Cu²⁺ + 2e⁻ → Cu); Anode có O₂ thoát ra (2H₂O → O₂↑ + 4H⁺ + 4e⁻). Màu xanh nhạt dần.\n• Anode Cu: Anode tan (Cu → Cu²⁺ + 2e⁻), Cathode có Cu bám. Nồng độ Cu²⁺ giữ nguyên.',
    tip: 'Khi anode là kim loại không trơ (Cu, Ag, Ni...), chính kim loại anode bị oxi hóa trước nước.',
    lessonSlug: '5-dien-phan',
  },
  {
    id: 'fc-10',
    category: 'Điện phân NaCl bão hòa',
    front: 'Phân biệt điện phân dung dịch NaCl bão hòa có màng ngăn và không có màng ngăn?',
    back: '• Có màng ngăn: 2NaCl + 2H₂O → 2NaOH + H₂↑ + Cl₂↑.\n• Không màng ngăn: Cl₂ + 2NaOH → NaCl + NaClO + H₂O ⇒ tổng: NaCl + H₂O → NaClO + H₂↑ (nước Javel).',
    tip: 'Màng ngăn giúp tách riêng khí Cl₂ ở anode khỏi NaOH ở cathode.',
    lessonSlug: '5-dien-phan',
  },
  {
    id: 'fc-11',
    category: 'Sản xuất nhôm',
    front: 'Ba vai trò của cryolite (Na₃AlF₆) trong điện phân Al₂O₃ nóng chảy?',
    back: '1. Hạ nhiệt độ nóng chảy từ ~2050 °C xuống ~900–950 °C.\n2. Tăng độ dẫn điện của hỗn hợp nóng chảy.\n3. Tạo lớp hỗn hợp nhẹ hơn Al lỏng nổi lên trên ngăn Al bị oxi hóa bởi O₂ không khí.',
    tip: 'Phương trình tổng: 2Al₂O₃ —đpnc, cryolite→ 4Al + 3O₂↑.',
    lessonSlug: '5-dien-phan',
  },
  {
    id: 'fc-12',
    category: 'Thứ tự phóng điện',
    front: 'Quy tắc thứ tự phóng điện trong dung dịch (điện cực trơ) tại Cathode và Anode?',
    back: '• Cathode (−): cation có E° lớn hơn bị khử trước (Ag⁺ > Fe³⁺ > Cu²⁺ > H⁺ > Fe²⁺...). Ion K⁺, Na⁺, Ca²⁺, Mg²⁺, Al³⁺ không bị khử trong nước → H₂O bị khử tạo H₂.\n• Anode (+): I⁻, Br⁻, Cl⁻ bị oxi hóa trước H₂O; gốc chứa oxygen (SO₄²⁻, NO₃⁻...) không bị oxi hóa → H₂O bị oxi hóa tạo O₂.',
    tip: 'Khi viết bài tập điện phân dung dịch, luôn liệt kê ion có mặt ở mỗi cực trước khi chọn chất phản ứng.',
    lessonSlug: '5-dien-phan',
  },
  {
    id: 'fc-13',
    category: 'Định luật Faraday',
    front: 'Các công thức cơ bản của định luật Faraday và giá trị hằng số F?',
    back: '• Q = I · t (C)\n• nₑ = Q / F = (I · t) / F (mol)\n• m = (M · I · t) / (z · F) (g)\nVới F = 96 500 C/mol và t tính bằng giây (s).',
    tip: 'Nếu tính theo từng bước (t → Q → nₑ → n chất → m hoặc V) sẽ xử lý dễ dàng cả bài nhiều giai đoạn.',
    lessonSlug: '6-dinh-luat-faraday',
  },
  {
    id: 'fc-14',
    category: 'Định luật Faraday',
    front: 'Liên hệ giữa nₑ và số mol sản phẩm Ag, Cu, H₂, Cl₂, O₂?',
    back: '• Ag (z = 1): n(Ag) = nₑ\n• Cu (z = 2): n(Cu) = nₑ / 2\n• H₂ (z = 2): n(H₂) = nₑ / 2\n• Cl₂ (z = 2): n(Cl₂) = nₑ / 2\n• O₂ (z = 4): n(O₂) = nₑ / 4',
    tip: 'Rất dễ quên hệ số 4 của O₂! Luôn viết nháp 2H₂O → O₂ + 4H⁺ + 4e⁻.',
    lessonSlug: '6-dinh-luat-faraday',
  },
  {
    id: 'fc-15',
    category: 'Bài toán nhiều giai đoạn',
    front: 'Làm sao biết nước đã bắt đầu điện phân ở cathode khi điện phân dung dịch CuSO₄?',
    back: 'So sánh nₑ thực tế = (I · t) / F với nₑ cần để khử hết Cu²⁺ = 2 · n(Cu²⁺).\n• Nếu nₑ ≤ 2 · n(Cu²⁺): chỉ tạo Cu.\n• Nếu nₑ > 2 · n(Cu²⁺): Cu²⁺ hết, phần e⁻ dư khử H₂O tạo khí H₂.',
    tip: 'Luôn so sánh nₑ thực tế với nₑ cần ở từng cực trước khi tính khối lượng hoặc thể tích khí.',
    lessonSlug: '6-dinh-luat-faraday',
  },
  {
    id: 'fc-16',
    category: 'Thể tích khí đkc',
    front: 'Công thức tính thể tích khí thoát ra tại điều kiện chuẩn 25 °C, 1 bar?',
    back: 'V = n(khí) × 24,79 (L).\nVí dụ: 0,005 mol O₂ chiếm thể tích V = 0,005 × 24,79 = 0,12395 L ≈ 0,124 L.',
    tip: 'Chương trình Hóa học 12 mới dùng 24,79 L/mol (25 °C, 1 bar), không dùng 22,4 L/mol cũ.',
    lessonSlug: '6-dinh-luat-faraday',
  },
];
