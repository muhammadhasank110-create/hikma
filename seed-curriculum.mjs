import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// ─── 1. Curricula ───────────────────────────────────────────────────────────
await conn.execute(`INSERT IGNORE INTO curricula (id, family, board, region, language, titleEn, titleAr, isActive) VALUES
  (1, 'igcse', 'Edexcel', 'International', 'both', 'IGCSE Edexcel', 'IGCSE إيدكسيل', 1),
  (2, 'national', 'Qatar MoEHE', 'Qatar', 'both', 'Qatar Ministry of Education', 'وزارة التعليم والتعليم العالي', 1)`);

// ─── 2. Subjects ─────────────────────────────────────────────────────────────
await conn.execute(`INSERT IGNORE INTO subjects (id, curriculumId, code, titleEn, titleAr, gradeRange, isActive) VALUES
  (1,  1, 'MATH-IGCSE',  'Mathematics',       'الرياضيات',    '9-11', 1),
  (2,  1, 'ENG-IGCSE',   'English Language',  'اللغة الإنجليزية', '9-11', 1),
  (3,  1, 'SCI-IGCSE',   'Science (Double)',  'العلوم (مزدوج)', '9-11', 1),
  (4,  2, 'MATH-MOEHE',  'Mathematics',       'الرياضيات',    '7-12', 1),
  (5,  2, 'ENG-MOEHE',   'English Language',  'اللغة الإنجليزية', '7-12', 1),
  (6,  2, 'SCI-MOEHE',   'Science',           'العلوم',       '7-12', 1)`);

// ─── 3. Topics ───────────────────────────────────────────────────────────────
await conn.execute(`INSERT IGNORE INTO topics (id, subjectId, code, titleEn, titleAr, \`order\`, isActive) VALUES
  -- IGCSE Maths
  (1,  1, 'NUM',   'Number',                    'الأعداد',                  1, 1),
  (2,  1, 'ALG',   'Algebra',                   'الجبر',                    2, 1),
  (3,  1, 'GEO',   'Geometry',                  'الهندسة',                  3, 1),
  (4,  1, 'STAT',  'Statistics & Probability',  'الإحصاء والاحتمالات',      4, 1),
  -- IGCSE English
  (5,  2, 'READ',  'Reading & Comprehension',   'القراءة والاستيعاب',       1, 1),
  (6,  2, 'WRITE', 'Writing Skills',            'مهارات الكتابة',           2, 1),
  (7,  2, 'SPEAK', 'Speaking & Listening',      'التحدث والاستماع',         3, 1),
  -- IGCSE Science
  (8,  3, 'BIO',   'Biology',                   'الأحياء',                  1, 1),
  (9,  3, 'CHEM',  'Chemistry',                 'الكيمياء',                 2, 1),
  (10, 3, 'PHYS',  'Physics',                   'الفيزياء',                 3, 1),
  -- Qatar MoEHE Maths
  (11, 4, 'NUM-Q', 'Number & Operations',       'الأعداد والعمليات',        1, 1),
  (12, 4, 'ALG-Q', 'Algebra',                   'الجبر',                    2, 1),
  (13, 4, 'GEO-Q', 'Geometry & Measurement',   'الهندسة والقياس',          3, 1),
  -- Qatar MoEHE English
  (14, 5, 'READ-Q','Reading',                   'القراءة',                  1, 1),
  (15, 5, 'WRIT-Q','Writing',                   'الكتابة',                  2, 1),
  -- Qatar MoEHE Science
  (16, 6, 'BIO-Q', 'Life Science',              'علوم الحياة',              1, 1),
  (17, 6, 'PHY-Q', 'Physical Science',          'العلوم الطبيعية',          2, 1)`);

// ─── 4. Spec Points ──────────────────────────────────────────────────────────
await conn.execute(`INSERT IGNORE INTO specPoints (id, curriculumId, subjectId, code, titleEn, titleAr, tier) VALUES
  (1,  1, 1, 'N1',  'Integers, powers and roots',       'الأعداد الصحيحة والقوى والجذور', 'foundation'),
  (2,  1, 1, 'N2',  'Fractions, decimals and percentages','الكسور والعشريات والنسب المئوية','foundation'),
  (3,  1, 1, 'A1',  'Algebraic manipulation',           'التعامل الجبري',                'higher'),
  (4,  1, 1, 'A2',  'Equations and inequalities',       'المعادلات والمتباينات',          'foundation'),
  (5,  1, 1, 'G1',  'Angles and polygons',              'الزوايا والمضلعات',              'foundation'),
  (6,  1, 1, 'G2',  'Circles',                          'الدوائر',                        'higher'),
  (7,  1, 1, 'S1',  'Statistical measures',             'المقاييس الإحصائية',             'foundation'),
  (8,  1, 1, 'P1',  'Probability',                      'الاحتمالات',                     'foundation'),
  (9,  1, 2, 'R1',  'Skimming and scanning',            'المسح والتصفح',                  'foundation'),
  (10, 1, 2, 'W1',  'Descriptive writing',              'الكتابة الوصفية',                'foundation'),
  (11, 1, 3, 'B1',  'Cell biology',                     'علم الخلية',                     'foundation'),
  (12, 1, 3, 'B2',  'Photosynthesis',                   'التمثيل الضوئي',                 'foundation'),
  (13, 1, 3, 'B3',  'Human biology',                    'علم الأحياء البشرية',            'higher'),
  (14, 1, 3, 'C1',  'Atomic structure',                 'البنية الذرية',                  'foundation'),
  (15, 1, 3, 'P1',  'Forces and motion',                'القوى والحركة',                  'foundation')`);

// ─── 5. Lessons ──────────────────────────────────────────────────────────────
await conn.execute(`INSERT IGNORE INTO lessons (id, topicId, titleEn, titleAr, \`order\`, estimatedMinutes, isActive) VALUES
  -- Maths
  (1,  1, 'Types of Numbers',                'أنواع الأعداد',                1, 20, 1),
  (2,  1, 'Fractions & Decimals',            'الكسور والأعداد العشرية',      2, 25, 1),
  (3,  1, 'Percentages',                     'النسب المئوية',                3, 20, 1),
  (4,  2, 'Expanding & Factorising',         'التوسيع والتحليل',             1, 30, 1),
  (5,  2, 'Solving Linear Equations',        'حل المعادلات الخطية',          2, 25, 1),
  (6,  2, 'Simultaneous Equations',          'المعادلات المتزامنة',          3, 30, 1),
  (7,  3, 'Angles in Polygons',              'الزوايا في المضلعات',          1, 25, 1),
  (8,  3, 'Pythagoras Theorem',              'نظرية فيثاغورس',               2, 25, 1),
  (9,  4, 'Mean, Median, Mode',             'المتوسط والوسيط والمنوال',      1, 20, 1),
  (10, 4, 'Probability Basics',             'أساسيات الاحتمالات',            2, 20, 1),
  -- English
  (11, 5, 'Reading Strategies',             'استراتيجيات القراءة',           1, 25, 1),
  (12, 5, 'Inference & Deduction',          'الاستنتاج والاستنباط',          2, 30, 1),
  (13, 6, 'Descriptive Writing',            'الكتابة الوصفية',               1, 30, 1),
  (14, 6, 'Argumentative Writing',          'الكتابة الجدلية',               2, 35, 1),
  (15, 7, 'Formal Presentations',           'العروض الرسمية',                1, 25, 1),
  -- Science
  (16, 8, 'Cell Structure & Function',      'بنية الخلية ووظيفتها',          1, 30, 1),
  (17, 8, 'Photosynthesis',                 'التمثيل الضوئي',                2, 30, 1),
  (18, 8, 'Respiration',                    'التنفس الخلوي',                  3, 25, 1),
  (19, 9, 'Atomic Structure',               'البنية الذرية',                  1, 30, 1),
  (20, 9, 'Chemical Bonding',               'الروابط الكيميائية',             2, 30, 1),
  (21, 10,'Forces & Newton Laws',           'القوى وقوانين نيوتن',           1, 30, 1),
  (22, 10,'Energy & Power',                 'الطاقة والقدرة',                 2, 25, 1)`);

// ─── 6. Sections (real content) ──────────────────────────────────────────────
const sections = [
  // Lesson 1 — Types of Numbers
  { lessonId: 1, order: 1, titleEn: "What are integers?", titleAr: "ما هي الأعداد الصحيحة؟",
    summaryEn: "Integers are whole numbers including negatives and zero.",
    summaryAr: "الأعداد الصحيحة هي أعداد كاملة تشمل السالبة والصفر.",
    bodyEn: `## Integers\n\nAn **integer** is any whole number — positive, negative, or zero.\n\n**Examples:** ...-3, -2, -1, 0, 1, 2, 3...\n\n### Key facts\n- Integers do **not** include fractions or decimals.\n- The set of integers is written as **ℤ**.\n- Positive integers are called **natural numbers** (ℕ).\n\n### On a number line\nIntegers are equally spaced on the number line. Moving **right** increases the value; moving **left** decreases it.\n\n> **Remember:** Zero is an integer, but it is neither positive nor negative.`,
    bodyAr: `## الأعداد الصحيحة\n\n**العدد الصحيح** هو أي عدد كامل — موجب أو سالب أو صفر.\n\n**أمثلة:** ...3-، 2-، 1-، 0، 1، 2، 3...\n\n### حقائق رئيسية\n- الأعداد الصحيحة **لا تشمل** الكسور أو الأعداد العشرية.\n- مجموعة الأعداد الصحيحة تُكتب **ℤ**.\n- الأعداد الصحيحة الموجبة تُسمى **الأعداد الطبيعية** (ℕ).\n\n### على خط الأعداد\nالأعداد الصحيحة متساوية المسافات على خط الأعداد. التحرك **يميناً** يزيد القيمة؛ التحرك **يساراً** يقللها.\n\n> **تذكّر:** الصفر عدد صحيح، لكنه ليس موجباً ولا سالباً.`,
    readingLevel: 2 },
  { lessonId: 1, order: 2, titleEn: "Prime numbers", titleAr: "الأعداد الأولية",
    summaryEn: "A prime has exactly two factors: 1 and itself.",
    summaryAr: "العدد الأولي له عاملان فقط: 1 وهو نفسه.",
    bodyEn: `## Prime Numbers\n\nA **prime number** has exactly **two distinct factors**: 1 and itself.\n\n**First primes:** 2, 3, 5, 7, 11, 13, 17, 19, 23, 29...\n\n### Is 1 prime?\nNo. 1 has only **one** factor (itself), so it is **not** prime.\n\n### Is 2 prime?\nYes — 2 is the **only even prime**.\n\n### Prime factorisation\nEvery integer > 1 can be written as a product of primes.\n\n**Example:** 60 = 2² × 3 × 5\n\n> **Exam tip:** Use a factor tree to find prime factorisation systematically.`,
    bodyAr: `## الأعداد الأولية\n\n**العدد الأولي** له **عاملان مختلفان فقط**: 1 وهو نفسه.\n\n**أول الأعداد الأولية:** 2، 3، 5، 7، 11، 13، 17، 19، 23، 29...\n\n### هل 1 عدد أولي؟\nلا. 1 له **عامل واحد فقط** (نفسه)، لذا فهو **ليس** أولياً.\n\n### هل 2 عدد أولي؟\nnعم — 2 هو **العدد الأولي الزوجي الوحيد**.\n\n### التحليل إلى عوامل أولية\nكل عدد صحيح > 1 يمكن كتابته كحاصل ضرب أعداد أولية.\n\n**مثال:** 60 = 2² × 3 × 5\n\n> **نصيحة الامتحان:** استخدم شجرة العوامل للتحليل الأولي بشكل منهجي.`,
    readingLevel: 2 },
  // Lesson 5 — Solving Linear Equations
  { lessonId: 5, order: 1, titleEn: "What is a linear equation?", titleAr: "ما هي المعادلة الخطية؟",
    summaryEn: "A linear equation has one unknown raised to the power 1.",
    summaryAr: "المعادلة الخطية لها مجهول واحد مرفوع للقوة 1.",
    bodyEn: `## Linear Equations\n\nA **linear equation** contains an unknown (usually *x*) raised to the power **1** — no squares, cubes, or higher powers.\n\n**General form:** ax + b = c\n\n### Solving strategy\n1. **Expand** any brackets.\n2. **Collect** like terms on each side.\n3. **Isolate** the unknown by doing the same operation to both sides.\n4. **Check** by substituting your answer back in.\n\n**Example:** Solve 3x + 7 = 22\n- Subtract 7: 3x = 15\n- Divide by 3: x = 5\n- Check: 3(5) + 7 = 22 ✓`,
    bodyAr: `## المعادلات الخطية\n\n**المعادلة الخطية** تحتوي على مجهول (عادةً *x*) مرفوع للقوة **1** — بدون مربعات أو مكعبات أو قوى أعلى.\n\n**الشكل العام:** ax + b = c\n\n### استراتيجية الحل\n1. **وسّع** أي أقواس.\n2. **اجمع** الحدود المتشابهة على كل جانب.\n3. **عزل** المجهول بإجراء نفس العملية على الطرفين.\n4. **تحقق** بتعويض إجابتك.\n\n**مثال:** حل 3x + 7 = 22\n- اطرح 7: 3x = 15\n- اقسم على 3: x = 5\n- تحقق: 3(5) + 7 = 22 ✓`,
    readingLevel: 2 },
  // Lesson 17 — Photosynthesis
  { lessonId: 17, order: 1, titleEn: "What is photosynthesis?", titleAr: "ما هو التمثيل الضوئي؟",
    summaryEn: "Photosynthesis converts light energy into chemical energy stored in glucose.",
    summaryAr: "التمثيل الضوئي يحوّل طاقة الضوء إلى طاقة كيميائية مخزنة في الجلوكوز.",
    bodyEn: `## Photosynthesis\n\n**Photosynthesis** is the process by which green plants (and some other organisms) use **sunlight**, **water**, and **carbon dioxide** to produce **glucose** and **oxygen**.\n\n### Word equation\n> Carbon dioxide + Water → Glucose + Oxygen\n\n### Symbol equation\n> 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂\n\n### Where does it happen?\nPhotosynthesis takes place in the **chloroplasts** — organelles found mainly in leaf cells. Chloroplasts contain the green pigment **chlorophyll**, which absorbs light energy.\n\n### Two stages\n1. **Light-dependent reactions** (in the thylakoid membrane) — light splits water, releasing oxygen.\n2. **Light-independent reactions / Calvin cycle** (in the stroma) — CO₂ is fixed into glucose.\n\n> **Key word:** The raw materials are CO₂ and H₂O. The products are glucose (C₆H₁₂O₆) and O₂.`,
    bodyAr: `## التمثيل الضوئي\n\n**التمثيل الضوئي** هو العملية التي تستخدم فيها النباتات الخضراء **ضوء الشمس** و**الماء** و**ثاني أكسيد الكربون** لإنتاج **الجلوكوز** و**الأكسجين**.\n\n### معادلة بالكلمات\n> ثاني أكسيد الكربون + الماء ← الجلوكوز + الأكسجين\n\n### المعادلة الرمزية\n> 6CO₂ + 6H₂O ← C₆H₁₂O₆ + 6O₂\n\n### أين يحدث؟\nيحدث التمثيل الضوئي في **البلاستيدات الخضراء** — عضيات توجد بشكل رئيسي في خلايا الأوراق. تحتوي البلاستيدات الخضراء على الصبغة الخضراء **الكلوروفيل** التي تمتص طاقة الضوء.\n\n### مرحلتان\n1. **التفاعلات الضوئية** (في غشاء الثايلاكويد) — الضوء يشطر الماء محرراً الأكسجين.\n2. **التفاعلات المستقلة عن الضوء / دورة كالفن** (في السدى) — يتثبت CO₂ في الجلوكوز.\n\n> **كلمة مفتاحية:** المواد الخام هي CO₂ و H₂O. المنتجات هي الجلوكوز (C₆H₁₂O₆) و O₂.`,
    readingLevel: 2 },
  { lessonId: 17, order: 2, titleEn: "Factors affecting photosynthesis", titleAr: "العوامل المؤثرة في التمثيل الضوئي",
    summaryEn: "Light intensity, CO₂ concentration, and temperature are the three limiting factors.",
    summaryAr: "شدة الضوء وتركيز CO₂ ودرجة الحرارة هي العوامل الثلاثة المحددة.",
    bodyEn: `## Limiting Factors of Photosynthesis\n\nThe **rate** of photosynthesis is controlled by the factor in shortest supply — the **limiting factor**.\n\n### Three main limiting factors\n\n| Factor | Effect when increased | Optimum |\n|---|---|---|\n| Light intensity | Rate increases (up to a point) | Bright indirect light |\n| CO₂ concentration | Rate increases | ~0.04% in air |\n| Temperature | Rate increases, then falls sharply above ~40°C | ~25–35°C |\n\n### Compensation point\nThe **compensation point** is the light intensity at which the rate of photosynthesis exactly equals the rate of respiration — net gas exchange is zero.\n\n> **Exam tip:** In a graph question, identify which factor is limiting by finding where the curve plateaus despite increasing one variable.`,
    bodyAr: `## العوامل المحددة للتمثيل الضوئي\n\n**معدل** التمثيل الضوئي يتحكم فيه العامل الأقل توفراً — **العامل المحدد**.\n\n### ثلاثة عوامل محددة رئيسية\n\n| العامل | التأثير عند الزيادة | الأمثل |\n|---|---|---|\n| شدة الضوء | يزيد المعدل (حتى حد معين) | ضوء ساطع غير مباشر |\n| تركيز CO₂ | يزيد المعدل | ~0.04% في الهواء |\n| درجة الحرارة | يزيد المعدل، ثم ينخفض فجأة فوق ~40°م | ~25-35°م |\n\n### نقطة التعويض\n**نقطة التعويض** هي شدة الضوء التي يتساوى عندها معدل التمثيل الضوئي مع معدل التنفس — تبادل الغازات الصافي يساوي صفراً.\n\n> **نصيحة الامتحان:** في سؤال الرسم البياني، حدد العامل المحدد بإيجاد المكان الذي يتسطح فيه المنحنى رغم زيادة متغير واحد.`,
    readingLevel: 2 },
  // Lesson 11 — Reading Strategies
  { lessonId: 11, order: 1, titleEn: "Skimming and Scanning", titleAr: "المسح والتصفح",
    summaryEn: "Skimming gives the gist; scanning finds specific information.",
    summaryAr: "التصفح يعطي الفكرة العامة؛ المسح يجد معلومات محددة.",
    bodyEn: `## Reading Strategies: Skimming & Scanning\n\n### Skimming\n**Skimming** means reading quickly to get the **general idea** (gist) of a text without reading every word.\n\n**How to skim:**\n- Read the title, headings, and subheadings.\n- Read the first and last sentence of each paragraph.\n- Look at any images, captions, or bold text.\n\n### Scanning\n**Scanning** means moving your eyes quickly over a text to find **specific information** — a name, date, number, or keyword.\n\n**How to scan:**\n- Know what you are looking for before you start.\n- Move your eyes in a Z or S pattern.\n- Stop when you spot the target word or phrase.\n\n> **Exam tip (IGCSE Edexcel):** In Section A, skim first to understand the text type and purpose, then scan for answers to specific questions.`,
    bodyAr: `## استراتيجيات القراءة: المسح والتصفح\n\n### التصفح\n**التصفح** يعني القراءة السريعة للحصول على **الفكرة العامة** للنص دون قراءة كل كلمة.\n\n**كيفية التصفح:**\n- اقرأ العنوان والعناوين الفرعية.\n- اقرأ الجملة الأولى والأخيرة من كل فقرة.\n- انظر إلى أي صور أو تعليقات أو نص غامق.\n\n### المسح\n**المسح** يعني تحريك عينيك بسرعة فوق النص للعثور على **معلومات محددة** — اسم أو تاريخ أو رقم أو كلمة مفتاحية.\n\n**كيفية المسح:**\n- اعرف ما تبحث عنه قبل أن تبدأ.\n- حرّك عينيك في نمط Z أو S.\n- توقف عندما تجد الكلمة أو العبارة المستهدفة.\n\n> **نصيحة الامتحان (IGCSE إيدكسيل):** في القسم أ، تصفّح أولاً لفهم نوع النص وغرضه، ثم امسح للعثور على إجابات الأسئلة المحددة.`,
    readingLevel: 2 },
  // Lesson 16 — Cell Structure
  { lessonId: 16, order: 1, titleEn: "Animal and Plant Cells", titleAr: "الخلايا الحيوانية والنباتية",
    summaryEn: "Both cell types share a nucleus, cytoplasm, and membrane; plant cells also have a wall, vacuole, and chloroplasts.",
    summaryAr: "كلا نوعي الخلايا يشتركان في النواة والسيتوبلازم والغشاء؛ الخلايا النباتية لها أيضاً جدار وفجوة وبلاستيدات خضراء.",
    bodyEn: `## Animal and Plant Cells\n\n### Structures common to both\n| Structure | Function |\n|---|---|\n| **Cell membrane** | Controls what enters and leaves the cell |\n| **Nucleus** | Contains DNA; controls cell activities |\n| **Cytoplasm** | Jelly-like fluid where chemical reactions occur |\n| **Mitochondria** | Site of aerobic respiration; produce ATP |\n| **Ribosomes** | Site of protein synthesis |\n\n### Plant cell only\n| Structure | Function |\n|---|---|\n| **Cell wall** | Made of cellulose; provides support and shape |\n| **Chloroplasts** | Contain chlorophyll; site of photosynthesis |\n| **Permanent vacuole** | Filled with cell sap; maintains turgor pressure |\n\n> **Memory tip:** Plant cells have a **W**all, a **V**acuole, and **C**hloroplasts — remember **WVC**.`,
    bodyAr: `## الخلايا الحيوانية والنباتية\n\n### التراكيب المشتركة بين النوعين\n| التركيب | الوظيفة |\n|---|---|\n| **غشاء الخلية** | يتحكم فيما يدخل ويخرج من الخلية |\n| **النواة** | تحتوي على DNA؛ تتحكم في أنشطة الخلية |\n| **السيتوبلازم** | سائل هلامي تحدث فيه التفاعلات الكيميائية |\n| **الميتوكوندريا** | موقع التنفس الهوائي؛ تنتج ATP |\n| **الريبوسومات** | موقع تخليق البروتين |\n\n### الخلية النباتية فقط\n| التركيب | الوظيفة |\n|---|---|\n| **جدار الخلية** | مصنوع من السيليلوز؛ يوفر الدعم والشكل |\n| **البلاستيدات الخضراء** | تحتوي على الكلوروفيل؛ موقع التمثيل الضوئي |\n| **الفجوة الدائمة** | مملوءة بعصارة الخلية؛ تحافظ على ضغط الامتلاء |\n\n> **نصيحة للحفظ:** الخلايا النباتية لها **ج**دار و**ف**جوة و**ب**لاستيدات خضراء — تذكّر **جفب**.`,
    readingLevel: 2 },
];

for (const s of sections) {
  await conn.execute(
    `INSERT IGNORE INTO sections (lessonId, \`order\`, titleEn, titleAr, summaryEn, summaryAr, bodyEn, bodyAr, readingLevel)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [s.lessonId, s.order, s.titleEn, s.titleAr, s.summaryEn, s.summaryAr, s.bodyEn, s.bodyAr, s.readingLevel]
  );
}

// ─── 7. Concepts ─────────────────────────────────────────────────────────────
await conn.execute(`INSERT IGNORE INTO concepts (id, subjectId, code, titleEn, titleAr, prerequisiteIds, bloomLevel) VALUES
  (1,  1, 'INT',   'Integers',             'الأعداد الصحيحة',    NULL, 1),
  (2,  1, 'FRAC',  'Fractions',            'الكسور',             NULL, 1),
  (3,  1, 'PRIME', 'Prime Numbers',        'الأعداد الأولية',    '[1]', 2),
  (4,  1, 'ALGE',  'Algebraic Expressions','التعابير الجبرية',   '[1]', 2),
  (5,  1, 'LINEQ', 'Linear Equations',     'المعادلات الخطية',   '[4]', 3),
  (6,  3, 'CELL',  'Cell Structure',       'بنية الخلية',        NULL, 1),
  (7,  3, 'PHOTO', 'Photosynthesis',       'التمثيل الضوئي',     '[6]', 2),
  (8,  3, 'RESP',  'Respiration',          'التنفس الخلوي',      '[6]', 2),
  (9,  2, 'SKIM',  'Skimming & Scanning',  'المسح والتصفح',      NULL, 1),
  (10, 2, 'WRITE', 'Writing Techniques',   'تقنيات الكتابة',     '[9]', 2)`);

await conn.end();
console.log("✅  Curriculum seed complete.");
