export interface LessonSelfCheck {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface WorkedExample {
  title: string;
  tag?: 'Ví dụ đề cương' | 'Ví dụ tự luyện';
  statement: string;
  steps: { label: string; detail: string; equation?: string }[];
  conclusion: string;
}

export interface LessonPitfall {
  mistake: string;
  correction: string;
}

export interface LessonContentBlock {
  heading: string;
  tag?: 'Kiến thức bổ sung';
  paragraphs: string[];
  equations?: { label?: string; formula: string }[];
  bullets?: string[];
  table?: {
    caption: string;
    headers: string[];
    rows: string[][];
  };
}

export interface LessonData {
  number: number;
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  sourcePages: string;
  sourceNote?: string;
  openingQuestion: {
    prompt: string;
    guidingAnswer: string;
  };
  coreBlocks: LessonContentBlock[];
  workedExamples: WorkedExample[];
  pitfalls: LessonPitfall[];
  selfChecks: LessonSelfCheck[];
  simulationLink?: {
    label: string;
    tab: 'pin-zn-cu' | 'dien-phan-cuso4' | 'nacl-nong-chay' | 'faraday';
  };
}

export const LESSONS: LessonData[] = [
  // ==================== BÀI 1 ====================
  {
    number: 1,
    slug: '1-cap-oxi-hoa-khu',
    title: 'Cặp oxi hóa – khử và điện cực',
    shortTitle: 'Cặp oxi hóa – khử',
    summary:
      'Quy ước viết dạng oxi hóa/dạng khử, nhận diện chất oxi hóa – chất khử và đọc bán phản ứng chuẩn.',
    sourcePages: 'Đề cương Chương 5 · Trang 1',
    openingQuestion: {
      prompt:
        'Khi nhúng một thanh kẽm (Zn) vào dung dịch muối ZnSO₄, thanh kẽm và ion Zn²⁺ trong dung dịch liên hệ với nhau bằng quá trình trao đổi electron nào?',
      guidingAnswer:
        'Trên bề mặt tiếp xúc giữa thanh kim loại và dung dịch thiết lập cân bằng động giữa dạng oxi hóa (Zn²⁺) và dạng khử (Zn): Zn²⁺ + 2e⁻ ⇌ Zn. Hệ gồm kim loại tiếp xúc với dung dịch chứa ion của chính nó tạo thành một điện cực.',
    },
    coreBlocks: [
      {
        heading: '1. Khái niệm và quy ước viết cặp oxi hóa – khử',
        paragraphs: [
          'Dạng oxi hóa (Ox) và dạng khử (Kh) của cùng một nguyên tố hóa học có thể chuyển hóa qua lại cho nhau bằng cách nhận hoặc nhường electron tạo thành một cặp oxi hóa – khử.',
          'Theo quy ước chuẩn, ta luôn viết dạng oxi hóa (có số oxi hóa cao hơn) ở trước và dạng khử (có số oxi hóa thấp hơn) ở sau, ngăn cách bằng dấu gạch chéo: Dạng oxi hóa / Dạng khử.',
        ],
        equations: [
          { label: 'Tổng quát (cặp kim loại)', formula: 'Mⁿ⁺/M    với bán phản ứng:   Mⁿ⁺ + ne⁻ ⇌ M' },
          { label: 'Cặp của kẽm', formula: 'Zn²⁺/Zn    với bán phản ứng:   Zn²⁺ + 2e⁻ ⇌ Zn' },
          { label: 'Cặp của đồng', formula: 'Cu²⁺/Cu    với bán phản ứng:   Cu²⁺ + 2e⁻ ⇌ Cu' },
          { label: 'Cặp ion của sắt', formula: 'Fe³⁺/Fe²⁺   với bán phản ứng:   Fe³⁺ + e⁻ ⇌ Fe²⁺' },
        ],
      },
      {
        heading: '2. Nhận biết chất oxi hóa, chất khử và cách đọc bán phản ứng',
        paragraphs: [
          'Bán phản ứng chuẩn thường viết theo chiều khử (nhận electron ở vế trái). Để đọc đúng bản chất, hãy quan sát chiều thay đổi số oxi hóa và vị trí của electron:',
        ],
        bullets: [
          'Chất oxi hóa (dạng oxi hóa): nhận electron, số oxi hóa giảm (ví dụ: Cu²⁺ + 2e⁻ → Cu; Fe³⁺ + e⁻ → Fe²⁺). Đây là quá trình khử.',
          'Chất khử (dạng khử): nhường electron, số oxi hóa tăng (ví dụ: Zn → Zn²⁺ + 2e⁻; Fe²⁺ → Fe³⁺ + e⁻). Đây là quá trình oxi hóa.',
          'Luôn kiểm tra hai điều kiện bảo toàn cho mọi bán phản ứng: bảo toàn số nguyên tử của từng nguyên tố và bảo toàn tổng điện tích hai vế.',
        ],
      },
      {
        heading: '3. Khái niệm điện cực',
        paragraphs: [
          'Một điện cực (bán pin) được tạo thành khi đặt thanh dẫn điện tiếp xúc với dung dịch chất điện li chứa cặp oxi hóa – khử tương ứng:',
        ],
        table: {
          caption: 'Phân loại điện cực cơ bản thường gặp trong Chương 5',
          headers: ['Loại điện cực', 'Cặp tiêu biểu', 'Cấu tạo', 'Bán phản ứng'],
          rows: [
            ['Điện cực kim loại', 'Zn²⁺/Zn', 'Thanh Zn nhúng trong dung dịch ZnSO₄', 'Zn²⁺ + 2e⁻ ⇌ Zn'],
            ['Điện cực kim loại', 'Cu²⁺/Cu', 'Thanh Cu nhúng trong dung dịch CuSO₄', 'Cu²⁺ + 2e⁻ ⇌ Cu'],
            ['Điện cực trơ (ion/ion)', 'Fe³⁺/Fe²⁺', 'Thanh Pt nhúng trong dung dịch chứa Fe³⁺ và Fe²⁺', 'Fe³⁺ + e⁻ ⇌ Fe²⁺'],
          ],
        },
      },
    ],
    workedExamples: [
      {
        title: 'Xác định cặp oxi hóa – khử và bán phản ứng từ phương trình ion',
        tag: 'Ví dụ đề cương',
        statement:
          'Xét phản ứng oxi hóa – khử xảy ra trong dung dịch: Zn + 2Fe³⁺ → Zn²⁺ + 2Fe²⁺. Hãy xác định chất khử, chất oxi hóa, hai cặp oxi hóa – khử tương ứng và viết hai bán phản ứng.',
        steps: [
          {
            label: 'Bước 1: Xác định sự thay đổi số oxi hóa',
            detail:
              'Số oxi hóa của Zn tăng từ 0 lên +2 nên Zn là chất khử. Số oxi hóa của Fe giảm từ +3 (trong Fe³⁺) xuống +2 (trong Fe²⁺) nên Fe³⁺ là chất oxi hóa.',
          },
          {
            label: 'Bước 2: Gọi tên hai cặp oxi hóa – khử theo đúng quy ước Ox/Kh',
            detail: 'Cặp của kẽm là Zn²⁺/Zn; cặp của sắt tham gia phản ứng là Fe³⁺/Fe²⁺.',
          },
          {
            label: 'Bước 3: Viết và kiểm tra bảo toàn điện tích hai bán phản ứng',
            detail: 'Kiểm tra số nguyên tử và tổng điện tích hai vế của từng quá trình:',
            equation: 'Quá trình oxi hóa: Zn → Zn²⁺ + 2e⁻  (điện tích: 0 = +2 − 2)\nQuá trình khử: 2Fe³⁺ + 2e⁻ → 2Fe²⁺  (điện tích: +6 − 2 = +4)',
          },
        ],
        conclusion:
          'Hai cặp oxi hóa – khử là Zn²⁺/Zn và Fe³⁺/Fe²⁺; tổng số electron nhường bằng tổng số electron nhận (2e⁻).',
      },
    ],
    pitfalls: [
      {
        mistake: 'Viết ngược cặp oxi hóa – khử thành Zn/Zn²⁺ hoặc Fe²⁺/Fe³⁺.',
        correction:
          'Luôn đặt dạng oxi hóa (điện tích dương lớn hơn / số oxi hóa cao hơn) ở bên trái dấu gạch chéo: Zn²⁺/Zn, Fe³⁺/Fe²⁺.',
      },
      {
        mistake: 'Nhầm lẫn giữa "chất khử" và "quá trình khử".',
        correction:
          'Chất khử nhường electron nên chịu quá trình oxi hóa (bị oxi hóa). Chất oxi hóa nhận electron nên chịu quá trình khử (bị khử).',
      },
      {
        mistake: 'Quên thanh dẫn trơ đối với cặp Fe³⁺/Fe²⁺.',
        correction:
          'Cả Fe³⁺ và Fe²⁺ đều tan trong dung dịch nên cần thanh dẫn trơ như bạch kim (Pt) hoặc than chì (C) để dẫn electron ra mạch ngoài.',
      },
    ],
    selfChecks: [
      {
        id: 'l1-sc1',
        question: 'Trong cặp oxi hóa – khử Cu²⁺/Cu, dạng nào là chất khử?',
        options: ['Ion Cu²⁺', 'Kim loại Cu', 'Cả hai đều là chất khử', 'Không có chất khử'],
        correctIndex: 1,
        explanation: 'Cu có số oxi hóa 0 (thấp hơn +2), có khả năng nhường 2e⁻ tạo Cu²⁺ nên Cu là dạng khử.',
      },
      {
        id: 'l1-sc2',
        question: 'Bán phản ứng nào viết đúng bảo toàn nguyên tố và điện tích cho cặp Fe³⁺/Fe²⁺?',
        options: [
          'Fe³⁺ + 2e⁻ ⇌ Fe²⁺',
          'Fe³⁺ ⇌ Fe²⁺ + e⁻',
          'Fe³⁺ + e⁻ ⇌ Fe²⁺',
          'Fe²⁺ + e⁻ ⇌ Fe³⁺',
        ],
        correctIndex: 2,
        explanation: 'Vế trái (+3) + (−1) = +2, bằng điện tích của Fe²⁺ ở vế phải.',
      },
      {
        id: 'l1-sc3',
        question: 'Trong quá trình Cu → Cu²⁺ + 2e⁻, kim loại Cu đang tham gia quá trình nào?',
        options: ['Quá trình khử', 'Quá trình oxi hóa', 'Quá trình trung hòa', 'Quá trình điện li'],
        correctIndex: 1,
        explanation: 'Cu nhường 2 electron (số oxi hóa tăng từ 0 lên +2), do đó đây là quá trình oxi hóa.',
      },
    ],
  },

  // ==================== BÀI 2 ====================
  {
    number: 2,
    slug: '2-the-dien-cuc-chuan',
    title: 'Thế điện cực chuẩn E°',
    shortTitle: 'Thế điện cực chuẩn E°',
    summary:
      'Điện cực hydrogen chuẩn 0,000 V, bảng tra E° tương tác và cách so sánh tính oxi hóa – tính khử.',
    sourcePages: 'Đề cương Chương 5 · Trang 2–3',
    openingQuestion: {
      prompt:
        'Vì sao không thể đo trực tiếp thế tuyệt đối của một điện cực đơn lẻ như Cu²⁺/Cu, mà phải ghép nó với một điện cực chuẩn làm mốc?',
      guidingAnswer:
        'Vôn kế chỉ đo được hiệu điện thế giữa hai cực. Do đó, các nhà hóa học quy ước chọn điện cực hydrogen chuẩn (E° = 0,000 V) làm mốc số 0 để đo và so sánh thế của mọi cặp oxi hóa – khử khác.',
    },
    coreBlocks: [
      {
        heading: '1. Điện cực hydrogen chuẩn (SHE) và điều kiện chuẩn',
        paragraphs: [
          'Thế điện cực chuẩn (ký hiệu E°, đơn vị Vôn – V) của một cặp oxi hóa – khử được xác định tại điều kiện chuẩn: nồng độ ion trong dung dịch là 1 M, áp suất khí là 1 bar và nhiệt độ thường xét là 25 °C (298 K).',
          'Điện cực hydrogen chuẩn gồm lá bạch kim (Pt) phủ muội Pt nhúng trong dung dịch acid có [H⁺] = 1 M, có dòng khí H₂ tinh khiết sục liên tục ở áp suất 1 bar. Theo quy ước quốc tế:',
        ],
        equations: [
          {
            label: 'Mốc chuẩn quốc tế',
            formula: '2H⁺(aq, 1 M) + 2e⁻ ⇌ H₂(g, 1 bar)      E°(2H⁺/H₂) = 0,000 V',
          },
        ],
      },
      {
        heading: '2. Ý nghĩa của giá trị E° khi so sánh tính oxi hóa và tính khử',
        paragraphs: [
          'Tất cả giá trị E° trong bảng thế điện cực chuẩn đều là thế khử chuẩn (viết theo chiều nhận electron Ox + ne⁻ ⇌ Kh). Quy luật so sánh rất ngắn gọn:',
        ],
        bullets: [
          'E° càng lớn (càng dương): dạng oxi hóa có tính oxi hóa càng mạnh (càng dễ nhận electron), còn dạng khử có tính khử càng yếu.',
          'E° càng nhỏ (càng âm): dạng khử có tính khử càng mạnh (càng dễ nhường electron), còn dạng oxi hóa có tính oxi hóa càng yếu.',
          'Khi sắp xếp các cặp theo chiều E° tăng dần từ trái sang phải: tính oxi hóa của dạng oxi hóa tăng dần, tính khử của dạng khử giảm dần.',
        ],
      },
    ],
    workedExamples: [
      {
        title: 'Sắp xếp tính oxi hóa và tính khử từ giá trị E°',
        tag: 'Ví dụ đề cương',
        statement:
          'Cho các giá trị thế điện cực chuẩn: E°(Fe²⁺/Fe) = −0,440 V; E°(Cu²⁺/Cu) = +0,340 V; E°(Fe³⁺/Fe²⁺) = +0,771 V; E°(Ag⁺/Ag) = +0,799 V. Hãy sắp xếp theo chiều tăng dần tính oxi hóa của các ion và chiều giảm dần tính khử của các dạng khử.',
        steps: [
          {
            label: 'Bước 1: Xếp các cặp theo thứ tự E° tăng dần (chú ý dấu âm/dương)',
            detail: '−0,440 V < +0,340 V < +0,771 V < +0,799 V.',
            equation: 'Fe²⁺/Fe  <  Cu²⁺/Cu  <  Fe³⁺/Fe²⁺  <  Ag⁺/Ag',
          },
          {
            label: 'Bước 2: Đọc chiều tính oxi hóa (dạng viết trên/trước)',
            detail: 'E° càng lớn thì tính oxi hóa càng mạnh:',
            equation: 'Tính oxi hóa tăng dần:  Fe²⁺ < Cu²⁺ < Fe³⁺ < Ag⁺',
          },
          {
            label: 'Bước 3: Đọc chiều tính khử (dạng viết dưới/sau)',
            detail: 'E° càng lớn thì tính khử càng yếu (ngược chiều tính oxi hóa):',
            equation: 'Tính khử giảm dần:  Fe > Cu > Fe²⁺ > Ag',
          },
        ],
        conclusion:
          'Ion Ag⁺ có tính oxi hóa mạnh nhất; kim loại Fe có tính khử mạnh nhất trong bốn cặp đã cho.',
      },
    ],
    pitfalls: [
      {
        mistake: 'So sánh nhầm độ lớn số âm, tưởng −0,763 lớn hơn −0,440.',
        correction:
          'Trên trục số, −0,763 < −0,440. Vì thế Zn (E° = −0,763 V) có tính khử mạnh hơn Fe (E° = −0,440 V).',
      },
      {
        mistake: 'Tưởng rằng khi nhân đôi hệ số bán phản ứng (ví dụ 2Ag⁺ + 2e⁻ → 2Ag) thì E° cũng nhân đôi.',
        correction:
          'Thế điện cực chuẩn E° là đại lượng cường độ (không phụ thuộc lượng chất). Nhân hệ số bán phản ứng KHÔNG làm thay đổi giá trị E°.',
      },
    ],
    selfChecks: [
      {
        id: 'l2-sc1',
        question: 'Cặp nào dưới đây có dạng khử mạnh nhất?',
        options: [
          'Mg²⁺/Mg (E° = −2,356 V)',
          'Zn²⁺/Zn (E° = −0,763 V)',
          '2H⁺/H₂ (E° = 0,000 V)',
          'Cu²⁺/Cu (E° = +0,340 V)',
        ],
        correctIndex: 0,
        explanation: 'E° = −2,356 V nhỏ nhất nên dạng khử Mg có tính khử mạnh nhất.',
      },
      {
        id: 'l2-sc2',
        question: 'Giá trị E° của cặp Cu²⁺/Cu (+0,340 V) cho biết điều gì khi so với cặp 2H⁺/H₂ (0,000 V)?',
        options: [
          'Cu khử mạnh hơn H₂',
          'Cu²⁺ có tính oxi hóa mạnh hơn H⁺',
          'Cu dễ tan trong HCl loãng tạo H₂',
          'H⁺ có tính oxi hóa mạnh hơn Cu²⁺',
        ],
        correctIndex: 1,
        explanation: 'Vì +0,340 V > 0,000 V nên dạng oxi hóa Cu²⁺ mạnh hơn H⁺, còn dạng khử Cu yếu hơn H₂.',
      },
      {
        id: 'l2-sc3',
        question: 'Nếu viết bán phản ứng 2Ag⁺ + 2e⁻ ⇌ 2Ag thì giá trị thế khử chuẩn E° bằng bao nhiêu?',
        options: ['+1,598 V', '+0,799 V', '−0,799 V', '+0,3995 V'],
        correctIndex: 1,
        explanation: 'E° không phụ thuộc hệ số cân bằng nên vẫn giữ nguyên +0,799 V.',
      },
    ],
  },

  // ==================== BÀI 3 ====================
  {
    number: 3,
    slug: '3-quy-tac-alpha',
    title: 'Quy tắc α và dự đoán phản ứng',
    shortTitle: 'Quy tắc α',
    summary:
      'Dự đoán chiều phản ứng oxi hóa – khử tự xảy ra, phản ứng chứa Fe³⁺/Fe²⁺ và ngoại lệ kim loại mạnh tác dụng nước.',
    sourcePages: 'Đề cương Chương 5 · Trang 3–4',
    sourceNote:
      'Trang 5 của bộ ảnh gốc chỉ xuất hiện ở mép ảnh nên các lưu ý mở rộng về điều kiện áp dụng được đối chiếu chuẩn hóa và gắn nhãn Kiến thức bổ sung.',
    openingQuestion: {
      prompt:
        'Vì sao thanh đồng (Cu) không tan trong dung dịch HCl loãng nhưng lại tan được trong dung dịch AgNO₃ và dung dịch FeCl₃?',
      guidingAnswer:
        'So sánh thế điện cực chuẩn: E°(2H⁺/H₂) = 0,000 V < E°(Cu²⁺/Cu) = +0,340 V < E°(Fe³⁺/Fe²⁺) = +0,771 V < E°(Ag⁺/Ag) = +0,799 V. Do đó Cu không khử được H⁺ nhưng khử được cả Fe³⁺ và Ag⁺.',
    },
    coreBlocks: [
      {
        heading: '1. Nguyên tắc của Quy tắc α',
        paragraphs: [
          'Đặt hai cặp oxi hóa – khử sao cho cặp có E° nhỏ hơn ở bên trái và cặp có E° lớn hơn ở bên phải (dạng oxi hóa viết trên, dạng khử viết dưới).',
          'Vẽ nét chữ α đi từ dạng oxi hóa mạnh (trên phải) xuống dạng khử mạnh (dưới trái), rồi chéo sang dạng oxi hóa yếu (trên trái) và kết thúc ở dạng khử yếu (dưới phải). Phản ứng tự xảy ra ở điều kiện chuẩn theo chiều tạo thành chất oxi hóa yếu hơn và chất khử yếu hơn.',
        ],
        equations: [
          {
            label: 'Tổng quát với E°(Ox₁/Kh₁) < E°(Ox₂/Kh₂)',
            formula: 'Kh₁ (mạnh hơn) + Ox₂ (mạnh hơn) → Ox₁ (yếu hơn) + Kh₂ (yếu hơn)',
          },
        ],
      },
      {
        heading: '2. Bốn nhóm phản ứng trọng tâm trong đề cương',
        paragraphs: [
          'Áp dụng quy tắc α cho bốn tình huống quen thuộc nhất trong bài kiểm tra Hóa học 12:',
        ],
        table: {
          caption: 'Các phản ứng minh họa quy tắc α (điều kiện chuẩn 1 M, 1 bar, 25 °C)',
          headers: ['Nhóm phản ứng', 'Cặp so sánh (E° nhỏ < E° lớn)', 'Phương trình ion rút gọn'],
          rows: [
            ['Đồng + muối bạc', 'Cu²⁺/Cu (+0,340 V) < Ag⁺/Ag (+0,799 V)', 'Cu + 2Ag⁺ → Cu²⁺ + 2Ag'],
            ['Kim loại + acid loãng', 'Fe²⁺/Fe (−0,440 V) < 2H⁺/H₂ (0,000 V)', 'Fe + 2H⁺ → Fe²⁺ + H₂↑'],
            ['Kim loại + dung dịch muối', 'Zn²⁺/Zn (−0,763 V) < Cu²⁺/Cu (+0,340 V)', 'Zn + Cu²⁺ → Zn²⁺ + Cu'],
            ['Phản ứng có Fe³⁺/Fe²⁺', 'Cu²⁺/Cu (+0,340 V) < Fe³⁺/Fe²⁺ (+0,771 V)', 'Cu + 2Fe³⁺ → Cu²⁺ + 2Fe²⁺'],
            ['Phản ứng có Fe³⁺/Fe²⁺', 'Fe³⁺/Fe²⁺ (+0,771 V) < Ag⁺/Ag (+0,799 V)', 'Fe²⁺ + Ag⁺ → Fe³⁺ + Ag↓'],
          ],
        },
      },
      {
        heading: '3. Điều kiện áp dụng và trường hợp kim loại phản ứng với nước trước',
        tag: 'Kiến thức bổ sung',
        paragraphs: [
          'Quy tắc α dự đoán chiều phản ứng theo nhiệt động học ở điều kiện chuẩn (25 °C, nồng độ ion 1 M, áp suất khí 1 bar). Khi nồng độ thay đổi rất mạnh hoặc tốc độ phản ứng quá chậm, hiện tượng thực tế có thể khác.',
          'Đặc biệt, với các kim loại kiềm và kiềm thổ hoạt động mạnh (K, Ba, Ca, Na — có E° rất âm, nhỏ hơn nhiều so với nước), khi thả vào dung dịch muối (như CuSO₄ hoặc FeCl₃), kim loại sẽ phản ứng với nước trước chứ không đẩy trực tiếp kim loại ra khỏi dung dịch muối:',
        ],
        equations: [
          { label: 'Giai đoạn 1 (tác dụng nước)', formula: '2Na + 2H₂O → 2NaOH + H₂↑' },
          { label: 'Giai đoạn 2 (tạo kết tủa hydroxide)', formula: 'Cu²⁺ + 2OH⁻ → Cu(OH)₂↓ (màu xanh lam)' },
        ],
      },
    ],
    workedExamples: [
      {
        title: 'Dự đoán chuỗi phản ứng khi cho bột Fe vào dung dịch AgNO₃ dư',
        tag: 'Ví dụ tự luyện',
        statement:
          'Cho một lượng nhỏ bột Fe vào dung dịch AgNO₃ dư ở điều kiện chuẩn. Biết E°(Fe²⁺/Fe) = −0,440 V; E°(Fe³⁺/Fe²⁺) = +0,771 V; E°(Ag⁺/Ag) = +0,799 V. Xác định các phản ứng xảy ra và sản phẩm cuối cùng.',
        steps: [
          {
            label: 'Bước 1: Xếp ba cặp liên quan theo E° tăng dần',
            detail: 'Fe²⁺/Fe (−0,440 V) < Fe³⁺/Fe²⁺ (+0,771 V) < Ag⁺/Ag (+0,799 V).',
          },
          {
            label: 'Bước 2: Phản ứng ban đầu của kim loại Fe với Ag⁺',
            detail: 'Theo quy tắc α giữa Fe²⁺/Fe và Ag⁺/Ag, Fe bị oxi hóa lên Fe²⁺ trước:',
            equation: 'Fe + 2Ag⁺ → Fe²⁺ + 2Ag↓',
          },
          {
            label: 'Bước 3: Kiểm tra xem ion Fe²⁺ sinh ra có phản ứng tiếp với Ag⁺ dư hay không',
            detail:
              'Vì E°(Fe³⁺/Fe²⁺) = +0,771 V < E°(Ag⁺/Ag) = +0,799 V và Ag⁺ còn dư, nên xảy ra tiếp phản ứng oxi hóa Fe²⁺ lên Fe³⁺:',
            equation: 'Fe²⁺ + Ag⁺ → Fe³⁺ + Ag↓',
          },
        ],
        conclusion:
          'Khi AgNO₃ dư, phương trình tổng cộng là Fe + 3Ag⁺ → Fe³⁺ + 3Ag↓; dung dịch sau phản ứng chứa Fe³⁺ (và Ag⁺ dư), chất rắn thu được là Ag.',
      },
    ],
    pitfalls: [
      {
        mistake: 'Cho rằng Cu + 2Fe³⁺ → Cu²⁺ + 2Fe (tạo kim loại sắt).',
        correction:
          'Cu chỉ khử Fe³⁺ về Fe²⁺ (Cu + 2Fe³⁺ → Cu²⁺ + 2Fe²⁺) vì E°(Cu²⁺/Cu) = +0,340 V lớn hơn E°(Fe²⁺/Fe) = −0,440 V nên Cu không thể khử tiếp Fe²⁺.',
      },
      {
        mistake: 'Viết Na + CuSO₄ → Na₂SO₄ + Cu trong dung dịch nước.',
        correction:
          'Na tác dụng với H₂O trước tạo NaOH và khí H₂, sau đó NaOH phản ứng với CuSO₄ tạo kết tủa xanh Cu(OH)₂.',
      },
    ],
    selfChecks: [
      {
        id: 'l3-sc1',
        question: 'Phản ứng nào sau đây tự xảy ra ở điều kiện chuẩn?',
        options: [
          'Cu + 2H⁺ → Cu²⁺ + H₂',
          'Ag + Fe³⁺ → Ag⁺ + Fe²⁺',
          'Cu + 2Fe³⁺ → Cu²⁺ + 2Fe²⁺',
          'Cu²⁺ + 2Ag → Cu + 2Ag⁺',
        ],
        correctIndex: 2,
        explanation: 'Vì E°(Cu²⁺/Cu) = +0,340 V < E°(Fe³⁺/Fe²⁺) = +0,771 V nên Cu khử được Fe³⁺ về Fe²⁺.',
      },
      {
        id: 'l3-sc2',
        question: 'Nhúng thanh Fe vào dung dịch CuSO₄, sau một thời gian hiện tượng quan sát được là:',
        options: [
          'Không có hiện tượng gì.',
          'Có lớp kim loại đỏ bám lên thanh Fe, màu xanh dung dịch nhạt dần.',
          'Có khí H₂ thoát ra mạnh.',
          'Có kết tủa trắng xuất hiện.',
        ],
        correctIndex: 1,
        explanation: 'Fe (−0,440 V) khử Cu²⁺ (+0,340 V): Fe + Cu²⁺ → Fe²⁺ + Cu (đỏ bám trên thanh Fe).',
      },
      {
        id: 'l3-sc3',
        question: 'Cho một mẩu nhỏ kim loại Ba vào dung dịch CuCl₂. Hiện tượng nào đúng?',
        options: [
          'Chỉ có kim loại Cu màu đỏ tách ra.',
          'Sủi bọt khí không màu (H₂) và xuất hiện kết tủa xanh lam Cu(OH)₂.',
          'Không phản ứng.',
          'Chỉ có khí Cl₂ màu vàng lục thoát ra.',
        ],
        correctIndex: 1,
        explanation: 'Ba phản ứng với nước trước tạo Ba(OH)₂ + H₂↑, sau đó OH⁻ kết tủa Cu²⁺ thành Cu(OH)₂ màu xanh lam.',
      },
    ],
  },

  // ==================== BÀI 4 ====================
  {
    number: 4,
    slug: '4-pin-galvani',
    title: 'Pin Galvani',
    shortTitle: 'Pin Galvani',
    summary:
      'Cấu tạo pin Zn–Cu, chiều electron và ion qua cầu muối, tính E°pin (1,103 V và 0,459 V) và đối chiếu bình điện phân.',
    sourcePages: 'Đề cương Chương 5 · Trang 4 và Trang 6',
    sourceNote:
      'Trang 5 của tài liệu chụp bị thiếu phần nội dung chính (chỉ có mép ảnh), trang 6 bị chụp lặp hai lần; nội dung pin Galvani được tổng hợp từ trang 4 và trang 6.',
    openingQuestion: {
      prompt:
        'Nếu nhúng thanh Zn trực tiếp vào dung dịch CuSO₄, phản ứng tỏa nhiệt mà không tạo dòng điện chạy qua dây dẫn. Pin Galvani tách hai nửa phản ứng ra như thế nào để thu được dòng điện?',
      guidingAnswer:
        'Pin Galvani đặt cặp Zn²⁺/Zn và cặp Cu²⁺/Cu vào hai cốc riêng biệt, nối hai thanh kim loại bằng dây dẫn ngoài để electron bắt buộc chạy qua dây, đồng thời nối hai dung dịch bằng cầu muối để khép kín mạch ion.',
    },
    coreBlocks: [
      {
        heading: '1. Cấu tạo và cơ chế hoạt động của pin Galvani Zn–Cu',
        paragraphs: [
          'Pin Zn–Cu (pin Daniell) gồm hai điện cực chuẩn: thanh Zn nhúng trong dung dịch ZnSO₄ 1 M và thanh Cu nhúng trong dung dịch CuSO₄ 1 M, nối nhau bằng dây dẫn ngoài có vôn kế và một cầu muối chứa dung dịch điện li mạnh (ví dụ KNO₃ bão hòa).',
          'Do E°(Zn²⁺/Zn) = −0,763 V < E°(Cu²⁺/Cu) = +0,340 V nên thanh Zn dễ nhường electron hơn thanh Cu:',
        ],
        equations: [
          { label: 'Tại Anode (−) · thanh Zn (quá trình oxi hóa)', formula: 'Zn(s) → Zn²⁺(aq) + 2e⁻' },
          { label: 'Tại Cathode (+) · thanh Cu (quá trình khử)', formula: 'Cu²⁺(aq) + 2e⁻ → Cu(s)' },
          { label: 'Phản ứng tổng cộng trong pin', formula: 'Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s)' },
        ],
        bullets: [
          'Chiều chuyển động của electron: chạy theo dây dẫn ngoài từ Anode (−, thanh Zn) sang Cathode (+, thanh Cu). Chiều dòng điện quy ước ngược lại (từ Cu sang Zn).',
          'Sự thay đổi ở điện cực: thanh Zn bị oxi hóa tan dần nên khối lượng giảm; ion Cu²⁺ nhận electron tạo Cu bám lên thanh Cu nên khối lượng thanh Cu tăng và màu xanh dung dịch CuSO₄ nhạt dần.',
          'Vai trò của cầu muối (KNO₃): (1) khép kín mạch điện; (2) trung hòa điện tích hai dung dịch — anion NO₃⁻ di chuyển vào ngăn Zn (nơi sinh thêm Zn²⁺) và cation K⁺ di chuyển vào ngăn Cu (nơi mất dần Cu²⁺). Nếu rút cầu muối hoặc mở mạch, dòng điện ngừng ngay.',
        ],
      },
      {
        heading: '2. Công thức tính sức điện động chuẩn E°pin',
        paragraphs: [
          'Sức điện động chuẩn của pin Galvani bằng hiệu thế điện cực chuẩn (thế khử chuẩn) của cathode trừ đi thế điện cực chuẩn của anode:',
        ],
        equations: [
          { label: 'Công thức chuẩn', formula: 'E°pin = E°cathode − E°anode  (với E°cathode > E°anode)' },
          {
            label: 'Pin Zn–Cu (theo số liệu đề cương)',
            formula: 'E°pin(Zn–Cu) = E°(Cu²⁺/Cu) − E°(Zn²⁺/Zn) = +0,340 − (−0,763) = 1,103 V',
          },
          {
            label: 'Pin Cu–Ag (theo số liệu đề cương)',
            formula: 'E°pin(Cu–Ag) = E°(Ag⁺/Ag) − E°(Cu²⁺/Cu) = +0,799 − (+0,340) = 0,459 V',
          },
        ],
      },
      {
        heading: '3. Bảng đối chiếu Pin Galvani và Bình điện phân',
        paragraphs: [
          'Đây là bảng so sánh cốt lõi giúp tránh nhầm dấu điện cực khi chuyển từ bài tập Pin sang bài tập Điện phân:',
        ],
        table: {
          caption: 'Đối chiếu Pin Galvani và Bình điện phân',
          headers: ['Tiêu chí', 'Pin Galvani', 'Bình điện phân'],
          rows: [
            ['Chuyển hóa năng lượng', 'Hóa năng → Điện năng', 'Điện năng → Hóa năng'],
            ['Nguồn điện', 'Tự phát sinh dòng điện nhờ phản ứng tự diễn biến', 'Cần nguồn điện một chiều (DC) bên ngoài'],
            ['Dấu của Anode', 'Cực âm (−)', 'Cực dương (+) · nối cực dương nguồn DC'],
            ['Dấu của Cathode', 'Cực dương (+)', 'Cực âm (−) · nối cực âm nguồn DC'],
            ['Phản ứng tại Anode', 'Quá trình oxi hóa (nhường e⁻)', 'Quá trình oxi hóa (nhường e⁻)'],
            ['Phản ứng tại Cathode', 'Quá trình khử (nhận e⁻)', 'Quá trình khử (nhận e⁻)'],
            ['Chiều electron ở mạch ngoài', 'Anode (−) → Cathode (+)', 'Anode (+) → qua nguồn DC → Cathode (−)'],
          ],
        },
      },
    ],
    workedExamples: [
      {
        title: 'Thiết lập và tính sức điện động chuẩn của pin Cu–Ag',
        tag: 'Ví dụ đề cương',
        statement:
          'Cho pin Galvani tạo bởi hai cặp Cu²⁺/Cu (E° = +0,340 V) và Ag⁺/Ag (E° = +0,799 V). Xác định anode, cathode, chiều electron, phản ứng xảy ra khi pin hoạt động và tính E°pin.',
        steps: [
          {
            label: 'Bước 1: Xác định hai cực dựa vào E°',
            detail:
              'Vì +0,340 V < +0,799 V nên điện cực Cu là Anode (−), điện cực Ag là Cathode (+).',
          },
          {
            label: 'Bước 2: Viết hai bán phản ứng và phương trình tổng',
            detail: 'Cân bằng số electron nhường và nhận (nhân đôi bán phản ứng ở cathode):',
            equation: 'Anode (−): Cu → Cu²⁺ + 2e⁻\nCathode (+): 2Ag⁺ + 2e⁻ → 2Ag\nPhản ứng tổng: Cu + 2Ag⁺ → Cu²⁺ + 2Ag',
          },
          {
            label: 'Bước 3: Xác định chiều electron và tính E°pin',
            detail: 'Electron đi qua dây dẫn ngoài từ thanh Cu sang thanh Ag. Tính sức điện động chuẩn:',
            equation: 'E°pin = E°(Ag⁺/Ag) − E°(Cu²⁺/Cu) = 0,799 − 0,340 = 0,459 V',
          },
        ],
        conclusion:
          'Pin Cu–Ag có sức điện động chuẩn 0,459 V; thanh Cu mòn dần còn thanh Ag có thêm bạc bám vào.',
      },
    ],
    pitfalls: [
      {
        mistake: 'Đánh đồng dấu cực: nghĩ rằng Anode lúc nào cũng mang dấu âm (−).',
        correction:
          'Anode mang dấu âm (−) trong pin Galvani, nhưng mang dấu dương (+) trong bình điện phân. Thứ KHÔNG BAO GIỜ ĐỔI là: Anode luôn xảy ra oxi hóa, Cathode luôn xảy ra khử.',
      },
      {
        mistake: 'Cho rằng electron chạy qua cầu muối để khép kín mạch.',
        correction:
          'Electron chỉ di chuyển trong dây dẫn kim loại bên ngoài. Trong cầu muối và dung dịch chỉ có các ion (như K⁺, NO₃⁻) di chuyển để dẫn điện và trung hòa điện tích.',
      },
    ],
    selfChecks: [
      {
        id: 'l4-sc1',
        question: 'Trong pin Galvani Zn–Cu, dấu cực và quá trình tại thanh Cu là:',
        options: [
          'Anode (−), oxi hóa Cu thành Cu²⁺',
          'Cathode (+), khử Cu²⁺ thành Cu',
          'Cathode (−), khử Cu²⁺ thành Cu',
          'Anode (+), oxi hóa Cu thành Cu²⁺',
        ],
        correctIndex: 1,
        explanation: 'Cu có E° lớn hơn Zn nên thanh Cu là Cathode (+), nơi Cu²⁺ nhận 2e⁻ tạo thành Cu.',
      },
      {
        id: 'l4-sc2',
        question: 'Nếu rút cầu muối KNO₃ ra khỏi pin Zn–Cu đang hoạt động, điều gì xảy ra?',
        options: [
          'Số chỉ vôn kế tăng gấp đôi.',
          'Mạch bị hở, dòng điện ngừng chạy và số chỉ vôn kế giảm về 0.',
          'Chiều electron đảo ngược từ Cu sang Zn.',
          'Pin vẫn chạy bình thường.',
        ],
        correctIndex: 1,
        explanation: 'Không có cầu muối, mạch điện bị hở và hai dung dịch mất trung hòa điện tích nên dòng điện ngừng ngay.',
      },
      {
        id: 'l4-sc3',
        question: 'Sức điện động chuẩn E°pin của pin Zn–Cu theo số liệu đề cương bằng:',
        options: ['0,423 V', '0,459 V', '1,103 V', '−1,103 V'],
        correctIndex: 2,
        explanation: 'E°pin = +0,340 − (−0,763) = 1,103 V.',
      },
    ],
    simulationLink: {
      label: 'Mở mô phỏng Pin Zn–Cu tương tác',
      tab: 'pin-zn-cu',
    },
  },

  // ==================== BÀI 5 ====================
  {
    number: 5,
    slug: '5-dien-phan',
    title: 'Điện phân',
    shortTitle: 'Điện phân',
    summary:
      'Điện phân nóng chảy (NaCl, Al₂O₃ với cryolite), điện phân dung dịch với điện cực trơ và anode tan, thứ tự phóng điện.',
    sourcePages: 'Đề cương Chương 5 · Trang 6–7 và Trang 9',
    sourceNote:
      'Trang 6 bị trùng trong tập ảnh nguồn; trang 8 chỉ xuất hiện một phần mép ảnh nên phần hệ thống hóa thứ tự phóng điện được đối chiếu bổ sung và gắn nhãn Kiến thức bổ sung.',
    openingQuestion: {
      prompt:
        'Cùng là muối ăn NaCl, vì sao điện phân NaCl nóng chảy thu được kim loại Na, còn điện phân dung dịch NaCl bão hòa lại thu được khí H₂ và dung dịch NaOH?',
      guidingAnswer:
        'Trong NaCl nóng chảy chỉ có Na⁺ và Cl⁻ nên Na⁺ bắt buộc bị khử thành Na ở cathode. Trong dung dịch NaCl có thêm H₂O; vì H₂O dễ bị khử hơn ion Na⁺ nên nước bị khử tạo H₂ và OH⁻ thay vì tạo Na.',
    },
    coreBlocks: [
      {
        heading: '1. Nguyên tắc chung và ba trường hợp điện phân',
        paragraphs: [
          'Điện phân là quá trình oxi hóa – khử xảy ra trên bề mặt các điện cực khi có dòng điện một chiều (DC) đi qua chất điện li nóng chảy hoặc dung dịch chất điện li.',
          'Trong bình điện phân: Cathode nối cực âm (−) nguồn DC hút cation về và xảy ra quá trình khử; Anode nối cực dương (+) nguồn DC hút anion về và xảy ra quá trình oxi hóa.',
        ],
        bullets: [
          'Điện phân nóng chảy: áp dụng để điều chế các kim loại hoạt động mạnh (K, Na, Ca, Mg, Al) vì không có mặt nước.',
          'Điện phân dung dịch với điện cực trơ (Pt, than chì C): điện cực không tham gia phản ứng; nước có thể bị khử ở cathode hoặc bị oxi hóa ở anode.',
          'Điện phân dung dịch với anode tan (ví dụ anode bằng Cu trong dung dịch CuSO₄): chính kim loại ở anode bị oxi hóa tan vào dung dịch thay cho nước và anion.',
        ],
      },
      {
        heading: '2. Bảng tổng hợp bán phản ứng và phương trình điện phân trọng tâm',
        paragraphs: [
          'Các trường hợp đọc rõ từ đề cương (trang 6–7) được kiểm tra bảo toàn nguyên tố và điện tích:',
        ],
        table: {
          caption: 'So sánh các quá trình điện phân trọng tâm Chương 5',
          headers: ['Hệ điện phân', 'Cathode (−) · Khử', 'Anode (+) · Oxi hóa', 'Phương trình tổng'],
          rows: [
            ['NaCl nóng chảy (điện cực trơ)', 'Na⁺ + e⁻ → Na', '2Cl⁻ → Cl₂↑ + 2e⁻', '2NaCl —đpnc→ 2Na + Cl₂↑'],
            ['Al₂O₃ nóng chảy (cryolite)', 'Al³⁺ + 3e⁻ → Al', '2O²⁻ → O₂↑ + 4e⁻', '2Al₂O₃ —đpnc, cryolite→ 4Al + 3O₂↑'],
            ['Dung dịch CuSO₄ (điện cực trơ, Cu²⁺ còn đủ)', 'Cu²⁺ + 2e⁻ → Cu', '2H₂O → O₂↑ + 4H⁺ + 4e⁻', '2CuSO₄ + 2H₂O —đpdd→ 2Cu + O₂↑ + 2H₂SO₄'],
            ['Dung dịch CuSO₄ (anode tan bằng Cu)', 'Cu²⁺ + 2e⁻ → Cu', 'Cu → Cu²⁺ + 2e⁻', 'Cu(anode) → Cu(cathode) (nồng độ Cu²⁺ không đổi)'],
            ['Dung dịch NaCl bão hòa (có màng ngăn)', '2H₂O + 2e⁻ → H₂↑ + 2OH⁻', '2Cl⁻ → Cl₂↑ + 2e⁻', '2NaCl + 2H₂O —đpdd, cmn→ 2NaOH + H₂↑ + Cl₂↑'],
            ['Dung dịch NaCl bão hòa (không màng ngăn)', '2H₂O + 2e⁻ → H₂↑ + 2OH⁻', '2Cl⁻ → Cl₂↑ + 2e⁻ (rồi Cl₂ + 2OH⁻ → Cl⁻ + ClO⁻ + H₂O)', 'NaCl + H₂O —đpdd, kmn→ NaClO + H₂↑'],
          ],
        },
      },
      {
        heading: '3. Phân biệt NaCl bão hòa có màng ngăn và không có màng ngăn',
        paragraphs: [
          'Khi điện phân dung dịch NaCl bão hòa bằng điện cực trơ, ở cathode luôn sinh H₂ và OH⁻ (tạo NaOH), ở anode luôn sinh khí Cl₂:',
        ],
        bullets: [
          'Có màng ngăn xốp: ngăn không cho khí Cl₂ ở anode tiếp xúc với NaOH ở cathode → thu riêng được ba sản phẩm công nghiệp là NaOH, H₂ và Cl₂.',
          'Không có màng ngăn: Cl₂ khuếch tán sang phản ứng ngay với NaOH tạo nước Javel (hỗn hợp NaCl và NaClO có tính tẩy màu, sát khuẩn): Cl₂ + 2NaOH → NaCl + NaClO + H₂O.',
        ],
      },
      {
        heading: '4. Vai trò của cryolite (Na₃AlF₆) trong sản xuất nhôm',
        paragraphs: [
          'Trong công nghiệp, nhôm được điều chế bằng điện phân Al₂O₃ nóng chảy hòa tan trong cryolite (Na₃AlF₆) với điện cực than chì. Cryolite đóng ba vai trò thiết yếu:',
        ],
        bullets: [
          'Hạ nhiệt độ nóng chảy của hỗn hợp từ khoảng 2 050 °C (của Al₂O₃ tinh khiết) xuống còn khoảng 900–950 °C, giúp tiết kiệm lớn năng lượng điện.',
          'Tăng độ dẫn điện của chất điện li nóng chảy.',
          'Tạo lớp chất lỏng nhẹ hơn nhôm nóng chảy nổi lên phía trên, ngăn nhôm lỏng mới tạo thành tiếp xúc và bị oxi hóa trở lại bởi O₂ trong không khí.',
        ],
      },
      {
        heading: '5. Thứ tự phóng điện trong phạm vi bài tập Chương 5',
        tag: 'Kiến thức bổ sung',
        paragraphs: [
          'Trong các bài tập điện phân dung dịch với điện cực trơ ở điều kiện thường gặp của Hóa học 12, xác định chất phản ứng tại mỗi cực theo thứ tự ưu tiên sau:',
        ],
        bullets: [
          'Tại Cathode (−, khử): cation có tính oxi hóa mạnh hơn (E° lớn hơn) bị khử trước: Ag⁺ > Fe³⁺ > Cu²⁺ > H⁺(acid) > Fe²⁺ > Zn²⁺... Các ion kim loại mạnh đứng đầu dãy (K⁺, Ba²⁺, Ca²⁺, Na⁺, Mg²⁺, Al³⁺) không bị khử trong dung dịch nước; thay vào đó H₂O bị khử: 2H₂O + 2e⁻ → H₂↑ + 2OH⁻.',
          'Tại Anode (+, oxi hóa — điện cực trơ): các anion halide không chứa oxygen (I⁻, Br⁻, Cl⁻) bị oxi hóa trước nước (ví dụ 2Cl⁻ → Cl₂↑ + 2e⁻). Các gốc acid chứa oxygen (SO₄²⁻, NO₃⁻, CO₃²⁻, PO₄³⁻) và F⁻ không bị oxi hóa; thay vào đó H₂O bị oxi hóa: 2H₂O → O₂↑ + 4H⁺ + 4e⁻.',
          'Nếu anode làm bằng kim loại không trơ (Cu, Ag, Ni...): chính kim loại anode bị oxi hóa tan vào dung dịch (M → Mⁿ⁺ + ne⁻), ứng dụng trong tinh luyện kim loại và mạ điện.',
        ],
      },
    ],
    workedExamples: [
      {
        title: 'So sánh điện phân dung dịch CuSO₄ với hai loại anode khác nhau',
        tag: 'Ví dụ đề cương',
        statement:
          'Xét hai bình điện phân đều chứa dung dịch CuSO₄ xanh lam. Bình A dùng hai điện cực than chì (trơ). Bình B dùng cathode than chì và anode bằng đồng (Cu). So sánh sản phẩm ở anode và sự thay đổi màu xanh của dung dịch ở hai bình khi Cu²⁺ còn đủ.',
        steps: [
          {
            label: 'Bước 1: Xét bình A (điện cực trơ)',
            detail: 'Ở cathode (−): Cu²⁺ + 2e⁻ → Cu (đồng đỏ bám). Ở anode (+): gốc SO₄²⁻ không phóng điện nên H₂O bị oxi hóa:',
            equation: 'Anode (+) bình A:  2H₂O → O₂↑ + 4H⁺ + 4e⁻',
          },
          {
            label: 'Bước 2: Xét bình B (anode bằng Cu)',
            detail: 'Ở cathode (−): vẫn có Cu²⁺ + 2e⁻ → Cu. Ở anode (+): thanh Cu bị oxi hóa tan vào dung dịch:',
            equation: 'Anode (+) bình B:  Cu → Cu²⁺ + 2e⁻',
          },
          {
            label: 'Bước 3: Đối chiếu màu dung dịch (nồng độ Cu²⁺)',
            detail:
              'Ở bình A, ion Cu²⁺ bị tiêu thụ dần mà không được bổ sung → màu xanh lam nhạt dần (và dung dịch có tính acid tăng do tạo H⁺). Ở bình B, mỗi mol Cu²⁺ bị khử ở cathode lại được bù đúng 1 mol Cu²⁺ tan từ anode → màu xanh dung dịch giữ nguyên.',
          },
        ],
        conclusion:
          'Bình A thoát khí O₂ ở anode và nhạt màu dung dịch; bình B không có khí thoát ra, thanh Cu anode mòn dần và màu dung dịch không đổi.',
      },
    ],
    pitfalls: [
      {
        mistake: 'Viết Na⁺ + e⁻ → Na khi điện phân dung dịch NaCl.',
        correction:
          'Trong dung dịch nước, Na⁺ không bị khử; nước bị khử tạo H₂ và OH⁻. Muốn thu kim loại Na phải điện phân NaCl nóng chảy.',
      },
      {
        mistake: 'Bỏ quên khí H₂ thoát ra ở cathode khi điện phân CuSO₄ điện cực trơ kéo dài sau khi Cu²⁺ đã hết.',
        correction:
          'Khi Cu²⁺ đã bị khử hết ở cathode, nước sẽ tiếp tục bị khử tạo khí H₂ (lúc này cả hai cực đều có khí thoát ra: H₂ ở cathode, O₂ ở anode).',
      },
    ],
    selfChecks: [
      {
        id: 'l5-sc1',
        question: 'Khi điện phân dung dịch NaCl bão hòa (điện cực trơ, có màng ngăn), chất thu được ở cathode (−) là:',
        options: ['Kim loại Na', 'Khí Cl₂', 'Khí H₂ và dung dịch NaOH', 'Khí O₂ và HCl'],
        correctIndex: 2,
        explanation: 'Tại cathode (−): 2H₂O + 2e⁻ → H₂↑ + 2OH⁻, kết hợp Na⁺ trong dung dịch tạo NaOH.',
      },
      {
        id: 'l5-sc2',
        question: 'Trong điện phân CuSO₄ với anode bằng đồng (Cu), nồng độ ion Cu²⁺ trong dung dịch:',
        options: ['Giảm dần về 0', 'Tăng dần lên', 'Không đổi', 'Giảm rồi tăng'],
        correctIndex: 2,
        explanation: 'Lượng Cu²⁺ sinh ra do anode Cu tan bằng đúng lượng Cu²⁺ bị khử bám vào cathode.',
      },
      {
        id: 'l5-sc3',
        question: 'Vì sao không dùng điện phân dung dịch AlCl₃ để sản xuất nhôm trong công nghiệp?',
        options: [
          'Vì AlCl₃ không tan trong nước.',
          'Vì trong dung dịch nước, H₂O bị khử ở cathode trước Al³⁺ nên không thu được kim loại Al.',
          'Vì Al phản ứng nổ với khí Cl₂.',
          'Vì không có nguồn điện đủ lớn.',
        ],
        correctIndex: 1,
        explanation: 'Ion Al³⁺ không bị khử trong dung dịch nước; phải điện phân Al₂O₃ nóng chảy có thêm cryolite.',
      },
    ],
    simulationLink: {
      label: 'Thử nghiệm mô phỏng Điện phân CuSO₄ và NaCl nóng chảy',
      tab: 'dien-phan-cuso4',
    },
  },

  // ==================== BÀI 6 ====================
  {
    number: 6,
    slug: '6-dinh-luat-faraday',
    title: 'Định luật Faraday',
    shortTitle: 'Định luật Faraday',
    summary:
      'Tính điện lượng Q, số mol electron nₑ, khối lượng m, thể tích khí tại 25 °C – 1 bar và xử lý bài điện phân nhiều giai đoạn.',
    sourcePages: 'Đề cương Chương 5 · Trang 9',
    sourceNote:
      'Các công thức cốt lõi lấy từ trang 9 đề cương; các ví dụ định lượng nhiều giai đoạn và bài tập khí đkc được biên soạn thêm và gắn nhãn Ví dụ tự luyện.',
    openingQuestion: {
      prompt:
        'Nếu biết cường độ dòng điện chạy qua bình điện phân (ampe) và thời gian điện phân, làm sao tính chính xác được bao nhiêu gam đồng bám lên cực âm hay bao nhiêu lít khí thoát ra?',
      guidingAnswer:
        'Dòng điện chạy qua bình chuyển một điện lượng xác định Q = I · t. Vì 1 mol electron luôn mang điện lượng đúng bằng hằng số Faraday F = 96 500 C/mol, ta quy đổi ngay sang số mol electron nₑ, rồi dựa vào bán phản ứng để tính số mol từng sản phẩm.',
    },
    coreBlocks: [
      {
        heading: '1. Hệ công thức Faraday và ý nghĩa từng đại lượng',
        paragraphs: [
          'Khi cho dòng điện không đổi cường độ I (A) chạy qua bình điện phân trong thời gian t (giây, s), lượng chất sinh ra (hoặc tan đi) ở mỗi điện cực tỉ lệ thuận với điện lượng Q đi qua bình:',
        ],
        equations: [
          { label: 'Điện lượng đi qua bình', formula: 'Q = I · t   (đơn vị: Coulomb, C)' },
          { label: 'Số mol electron trao đổi ở mỗi cực', formula: 'nₑ = Q / F = (I · t) / F   (với F = 96 500 C/mol)' },
          { label: 'Khối lượng chất giải phóng (1 giai đoạn, hiệu suất 100%)', formula: 'm = (M · I · t) / (z · F) = (nₑ / z) · M   (g)' },
          { label: 'Thể tích khí ở đkc (25 °C, 1 bar)', formula: 'V = n(khí) · 24,79   (L)' },
        ],
        bullets: [
          'M (g/mol): khối lượng mol của chất tạo thành ở điện cực (nguyên tử khối với kim loại, phân tử khối với khí như H₂ = 2, Cl₂ = 71, O₂ = 32).',
          'z (hay n): số mol electron trao đổi ứng với 1 mol sản phẩm theo đúng bán phản ứng điện cực.',
          'Đổi đơn vị thời gian trước khi tính: 1 phút = 60 s; 1 giờ = 3 600 s.',
        ],
      },
      {
        heading: '2. Bảng liên hệ số mol electron nₑ với các sản phẩm thường gặp',
        paragraphs: [
          'Ghi nhớ chính xác giá trị z cho từng chất giúp tránh lỗi sai hệ số 2 hoặc 4 rất phổ biến:',
        ],
        table: {
          caption: 'Liên hệ nₑ và số mol sản phẩm theo bán phản ứng',
          headers: ['Sản phẩm', 'Bán phản ứng tạo 1 mol chất', 'z (mol e⁻ / mol chất)', 'M (g/mol)', 'Quan hệ số mol'],
          rows: [
            ['Ag (rắn)', 'Ag⁺ + 1e⁻ → Ag', '1', '108', 'n(Ag) = nₑ'],
            ['Cu (rắn)', 'Cu²⁺ + 2e⁻ → Cu', '2', '63,5', 'n(Cu) = nₑ / 2'],
            ['H₂ (khí)', '2H₂O + 2e⁻ → H₂↑ + 2OH⁻', '2', '2', 'n(H₂) = nₑ / 2'],
            ['Cl₂ (khí)', '2Cl⁻ → Cl₂↑ + 2e⁻', '2', '71', 'n(Cl₂) = nₑ / 2'],
            ['O₂ (khí)', '2H₂O → O₂↑ + 4H⁺ + 4e⁻', '4', '32', 'n(O₂) = nₑ / 4'],
          ],
        },
      },
      {
        heading: '3. Quy trình 4 bước giải mọi bài toán Faraday',
        paragraphs: [
          'Thay vì áp dụng máy móc công thức gộp m = MIt/(zF) (dễ sai khi chất điện phân bị hết giữa chừng), hãy đi theo 4 bước chắc chắn:',
        ],
        bullets: [
          'Bước 1 — Đổi thời gian t sang giây (s), tính Q = I · t và tổng số mol electron thực tế nₑ = Q / 96 500.',
          'Bước 2 — Xác định các ion có mặt và viết thứ tự bán phản ứng ở Cathode (−) và Anode (+).',
          'Bước 3 — So sánh nₑ cần để điện phân hết từng chất ban đầu với nₑ thực tế nhằm xác định phản ứng dừng ở giai đoạn nào (còn dư chất tan hay đã điện phân tiếp nước).',
          'Bước 4 — Tính số mol sản phẩm ở từng giai đoạn, sau đó tính khối lượng m = n · M (g) hoặc thể tích khí V = n · 24,79 (L tại 25 °C, 1 bar).',
        ],
      },
    ],
    workedExamples: [
      {
        title: 'Ví dụ 1: Tính khối lượng Cu và thể tích khí O₂ tại 25 °C, 1 bar',
        tag: 'Ví dụ tự luyện',
        statement:
          'Điện phân dung dịch CuSO₄ dư bằng điện cực trơ với cường độ dòng điện I = 2 A trong thời gian t = 965 giây (hiệu suất 100%). Tính khối lượng Cu bám lên cathode và thể tích khí O₂ thoát ra ở anode tại 25 °C, 1 bar (M(Cu) = 63,5 g/mol; F = 96 500 C/mol).',
        steps: [
          {
            label: 'Bước 1: Tính điện lượng Q và số mol electron nₑ',
            detail: 'Thời gian đã ở đơn vị giây (t = 965 s):',
            equation: 'Q = I · t = 2 × 965 = 1 930 C\nnₑ = Q / F = 1 930 / 96 500 = 0,020 mol',
          },
          {
            label: 'Bước 2: Tính khối lượng Cu ở Cathode (−)',
            detail: 'Vì CuSO₄ dư nên chỉ có Cu²⁺ bị khử (z = 2):',
            equation: 'Cu²⁺ + 2e⁻ → Cu\nn(Cu) = nₑ / 2 = 0,020 / 2 = 0,010 mol\nm(Cu) = 0,010 × 63,5 = 0,635 g',
          },
          {
            label: 'Bước 3: Tính thể tích khí O₂ ở Anode (+) tại 25 °C, 1 bar',
            detail: 'Ở anode trơ, nước bị oxi hóa với z = 4:',
            equation: '2H₂O → O₂↑ + 4H⁺ + 4e⁻\nn(O₂) = nₑ / 4 = 0,020 / 4 = 0,005 mol\nV(O₂) = 0,005 × 24,79 = 0,12395 L ≈ 0,124 L',
          },
        ],
        conclusion:
          'Thu được 0,635 g Cu ở cathode và 0,12395 L khí O₂ (25 °C, 1 bar) ở anode. Bạn có thể kiểm chứng ngay bộ số liệu này trong Máy tính Faraday.',
      },
      {
        title: 'Ví dụ 2: Bài toán điện phân nhiều giai đoạn (Cu²⁺ hết trước khi ngừng dòng điện)',
        tag: 'Ví dụ tự luyện',
        statement:
          'Điện phân 200 mL dung dịch CuSO₄ 0,10 M bằng điện cực trơ với I = 2 A trong thời gian 48 phút 15 giây. Tính khối lượng kim loại bám vào cathode và tổng thể tích các khí thoát ra ở hai điện cực tại 25 °C, 1 bar.',
        steps: [
          {
            label: 'Bước 1: Đổi thời gian sang giây và tính nₑ thực tế',
            detail: '48 phút 15 giây = 48 × 60 + 15 = 2 895 s.',
            equation: 'Q = 2 × 2 895 = 5 790 C\nnₑ(thực tế) = 5 790 / 96 500 = 0,060 mol',
          },
          {
            label: 'Bước 2: So sánh nₑ cần cho Cu²⁺ với nₑ thực tế ở Cathode (−)',
            detail: 'Số mol Cu²⁺ ban đầu: n(Cu²⁺) = 0,200 × 0,10 = 0,020 mol.',
            equation: 'nₑ(cần khử hết Cu²⁺) = 2 × 0,020 = 0,040 mol < 0,060 mol',
          },
          {
            label: 'Bước 3: Chia hai giai đoạn tại Cathode (−)',
            detail:
              'Giai đoạn 1: Cu²⁺ bị khử hết tạo 0,020 mol Cu (m = 0,020 × 63,5 = 1,27 g).\nGiai đoạn 2: Số mol e⁻ còn lại = 0,060 − 0,040 = 0,020 mol tiếp tục khử H₂O tạo khí H₂:',
            equation: '2H₂O + 2e⁻ → H₂↑ + 2OH⁻  ⇒  n(H₂) = 0,020 / 2 = 0,010 mol',
          },
          {
            label: 'Bước 4: Tính O₂ ở Anode (+) và tổng thể tích khí',
            detail: 'Ở anode trơ, nước bị oxi hóa suốt toàn bộ thời gian điện phân với tổng nₑ = 0,060 mol:',
            equation: 'n(O₂) = 0,060 / 4 = 0,015 mol\nTổng n(khí) = n(H₂) + n(O₂) = 0,010 + 0,015 = 0,025 mol\nV(tổng khí) = 0,025 × 24,79 = 0,61975 L ≈ 0,620 L',
          },
        ],
        conclusion:
          'Cathode thu được 1,27 g Cu và 0,010 mol khí H₂; anode thu được 0,015 mol khí O₂. Tổng thể tích khí thoát ra ở hai cực là 0,620 L (tại 25 °C, 1 bar).',
      },
    ],
    pitfalls: [
      {
        mistake: 'Quên đổi thời gian từ phút hoặc giờ sang giây trước khi tính Q = I · t.',
        correction: 'Luôn chuyển đổi t về giây (s): t(s) = t(phút) × 60 = t(giờ) × 3 600.',
      },
      {
        mistake: 'Dùng z = 2 khi tính số mol khí O₂ (thay vì z = 4).',
        correction:
          'Trong bán phản ứng 2H₂O → O₂ + 4H⁺ + 4e⁻, 1 mol phân tử O₂ tương ứng 4 mol electron, nên n(O₂) = nₑ / 4.',
      },
      {
        mistake: 'Thay thẳng m = MIt/(zF) cho bài điện phân dung dịch khi không kiểm tra chất tan có bị hết trước hay không.',
        correction:
          'Luôn tính nₑ(thực tế) và so sánh với nₑ(cần) của lượng ion ban đầu; nếu nₑ(thực tế) lớn hơn thì phải tách giai đoạn nước điện phân.',
      },
    ],
    selfChecks: [
      {
        id: 'l6-sc1',
        question: 'Với I = 5 A chạy trong 193 giây, số mol electron nₑ trao đổi bằng:',
        options: ['0,005 mol', '0,010 mol', '0,020 mol', '0,100 mol'],
        correctIndex: 1,
        explanation: 'Q = 5 × 193 = 965 C ⇒ nₑ = 965 / 96 500 = 0,010 mol.',
      },
      {
        id: 'l6-sc2',
        question: 'Nếu nₑ = 0,040 mol, lượng khí O₂ tối đa sinh ra ở anode trơ bằng:',
        options: ['0,040 mol', '0,020 mol', '0,010 mol', '0,005 mol'],
        correctIndex: 2,
        explanation: 'n(O₂) = nₑ / 4 = 0,040 / 4 = 0,010 mol.',
      },
      {
        id: 'l6-sc3',
        question: 'Thể tích mol của chất khí ở điều kiện chuẩn 25 °C, 1 bar dùng trong Hóa học 12 là:',
        options: ['22,40 L/mol', '24,00 L/mol', '24,79 L/mol', '25,00 L/mol'],
        correctIndex: 2,
        explanation: 'Theo chương trình GDPT 2018, 1 mol khí ở 25 °C và 1 bar chiếm thể tích 24,79 L.',
      },
    ],
    simulationLink: {
      label: 'Mở Máy tính Faraday tương tác',
      tab: 'faraday',
    },
  },
];

export function getLessonBySlug(slug: string): LessonData | undefined {
  return LESSONS.find((l) => l.slug === slug);
}
