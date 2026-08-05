const mysql = require('mysql2/promise');

const units = [
  // Area 1: Compensatory Skills
  [1,null,'Braille Reading — Grade 1 Uncontracted','قراءة برايل — الدرجة الأولى',0,null,null,1],
  [1,null,'Braille Writing with Perkins Brailler','الكتابة ببرايل باستخدام آلة بيركنز',0,null,null,2],
  [1,null,'Slate and Stylus','اللوح والقلم',0,null,null,3],
  [1,null,'Braille Note-taking','تدوين الملاحظات بالبرايل',0,null,null,4],
  [1,null,'Tactile Graphics Reading','قراءة الرسومات اللمسية',0,null,null,5],
  [1,null,'Listening Skills and Auditory Memory','مهارات الاستماع والذاكرة السمعية',0,null,null,6],
  [1,null,'Concept Development','تطوير المفاهيم',0,null,null,7],
  [1,null,'Study and Organisation Skills','مهارات الدراسة والتنظيم',0,null,null,8],
  // Area 2: Orientation and Mobility
  [2,null,'Body Image and Spatial Concepts','صورة الجسم والمفاهيم المكانية',0,null,null,1],
  [2,null,'Protective Techniques','تقنيات الحماية',0,null,null,2],
  [2,null,'Sighted Guide Technique','تقنية المرشد البصري',0,null,null,3],
  [2,null,'Long White Cane — Basic Technique','العصا البيضاء الطويلة — الأساسيات',1,'Requires in-person practice with a qualified O&M specialist','يتطلب ممارسة شخصية مع متخصص في التنقل',4],
  [2,null,'Indoor Route Travel','التنقل داخل المباني',1,'Practice in your school or home environment','التدرب في بيئة مدرستك أو منزلك',5],
  [2,null,'Outdoor and Community Travel','التنقل في الخارج والمجتمع',1,'Requires supervised outdoor practice','يتطلب ممارسة خارجية مشرفة',6],
  [2,null,'GPS and Navigation Apps','تطبيقات GPS والملاحة',0,null,null,7],
  // Area 3: Social Interaction Skills
  [3,null,'Non-verbal Communication Awareness','الوعي بالتواصل غير اللفظي',0,null,null,1],
  [3,null,'Conversation Initiation and Turn-taking','بدء المحادثة والتناوب',0,null,null,2],
  [3,null,'Greeting and Farewell Etiquette','آداب التحية والوداع',0,null,null,3],
  [3,null,'Group Work and Collaboration','العمل الجماعي والتعاون',0,null,null,4],
  [3,null,'Conflict Resolution','حل النزاعات',0,null,null,5],
  [3,null,'Disability Disclosure','الإفصاح عن الإعاقة',0,null,null,6],
  // Area 4: Independent Living Skills
  [4,null,'Personal Hygiene and Grooming','النظافة الشخصية والعناية بالمظهر',0,null,null,1],
  [4,null,'Dressing and Clothing Management','ارتداء الملابس وإدارتها',0,null,null,2],
  [4,null,'Food Preparation and Kitchen Safety','تحضير الطعام وسلامة المطبخ',1,'Requires supervised kitchen practice','يتطلب ممارسة في المطبخ تحت الإشراف',3],
  [4,null,'Home Management and Organisation','إدارة المنزل وتنظيمه',0,null,null,4],
  [4,null,'Money Management','إدارة المال',0,null,null,5],
  [4,null,'Time Management','إدارة الوقت',0,null,null,6],
  [4,null,'Health and Medical Self-advocacy','المناصرة الصحية والطبية الذاتية',0,null,null,7],
  // Area 5: Recreation and Leisure
  [5,null,'Accessible Sports and Physical Activity','الرياضة والنشاط البدني المتاح',1,'Requires in-person participation','يتطلب المشاركة الشخصية',1],
  [5,null,'Music and Performing Arts','الموسيقى والفنون الأدائية',0,null,null,2],
  [5,null,'Accessible Games and Hobbies','الألعاب والهوايات المتاحة',0,null,null,3],
  [5,null,'Reading for Pleasure','القراءة للمتعة',0,null,null,4],
  [5,null,'Social Media and Online Communities','وسائل التواصل الاجتماعي والمجتمعات الإلكترونية',0,null,null,5],
  // Area 6: Career Education
  [6,null,'Self-awareness and Strengths','الوعي الذاتي ونقاط القوة',0,null,null,1],
  [6,null,'Career Exploration','استكشاف المهن',0,null,null,2],
  [6,null,'Job Application and Interview Skills','مهارات التقدم للوظائف والمقابلات',0,null,null,3],
  [6,null,'Workplace Rights and Accommodations','حقوق مكان العمل والتسهيلات',0,null,null,4],
  [6,null,'Entrepreneurship and Self-employment','ريادة الأعمال والعمل الحر',0,null,null,5],
  // Area 7: Assistive Technology
  [7,null,'Screen Reader Basics — NVDA/JAWS','أساسيات قارئ الشاشة — NVDA/JAWS',0,null,null,1],
  [7,null,'VoiceOver on iPhone/iPad','VoiceOver على iPhone/iPad',0,null,null,2],
  [7,null,'TalkBack on Android','TalkBack على Android',0,null,null,3],
  [7,null,'Braille Display Operation','تشغيل شاشة برايل',0,null,null,4],
  [7,null,'Magnification Software','برامج التكبير',0,null,null,5],
  [7,null,'Accessible Document Creation','إنشاء المستندات المتاحة',0,null,null,6],
  [7,null,'Hikma and AI Learning Tools','حكمة وأدوات التعلم بالذكاء الاصطناعي',0,null,null,7],
  // Area 8: Sensory Efficiency
  [8,null,'Visual Efficiency Skills','مهارات الكفاءة البصرية',0,null,null,1],
  [8,null,'Auditory Discrimination','التمييز السمعي',0,null,null,2],
  [8,null,'Tactile Discrimination','التمييز اللمسي',0,null,null,3],
  [8,null,'Olfactory and Gustatory Cues','الإشارات الشمية والذوقية',0,null,null,4],
  [8,null,'Low Vision Optical Devices','الأجهزة البصرية لضعف البصر',0,null,null,5],
  // Area 9: Self-Determination
  [9,null,'Self-knowledge and Identity','معرفة الذات والهوية',0,null,null,1],
  [9,null,'Goal Setting','تحديد الأهداف',0,null,null,2],
  [9,null,'Decision Making','اتخاذ القرار',0,null,null,3],
  [9,null,'Problem Solving','حل المشكلات',0,null,null,4],
  [9,null,'Self-advocacy','المناصرة الذاتية',0,null,null,5],
  [9,null,'Transition Planning','تخطيط الانتقال',0,null,null,6],
  [9,null,'Resilience and Emotional Regulation','المرونة والتنظيم العاطفي',0,null,null,7],
];

mysql.createConnection(process.env.DATABASE_URL).then(async conn => {
  let inserted = 0;
  for (const [areaId, lessonId, titleEn, titleAr, requiresInPersonPractice, inPersonNoteEn, inPersonNoteAr, order] of units) {
    await conn.execute(
      'INSERT INTO ecc_units (areaId, lessonId, titleEn, titleAr, requiresInPersonPractice, inPersonNoteEn, inPersonNoteAr, `order`) VALUES (?,?,?,?,?,?,?,?)',
      [areaId, lessonId, titleEn, titleAr, requiresInPersonPractice, inPersonNoteEn, inPersonNoteAr, order]
    );
    inserted++;
  }
  console.log('Inserted', inserted, 'units');
  conn.end();
}).catch(e => { console.error('ERROR:', e.message); process.exit(1); });
