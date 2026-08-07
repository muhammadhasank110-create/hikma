import { useState } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSounds } from "@/hooks/useSounds";
import {
  CheckCircle2, Clock, FileText, Lightbulb,
  Trophy, RefreshCw, BookOpen, Target, AlertCircle
} from "lucide-react";

const COMMAND_WORDS = [
  {
    word: "State", wordAr: "اذكر",
    defEn: "Give a specific name, value, or brief answer — no explanation needed.",
    defAr: "أعطِ اسماً محدداً أو قيمة أو إجابة مختصرة — لا حاجة للشرح.",
    marksHint: "1–2 marks. One clear point per mark.",
    marksHintAr: "1–2 درجات. نقطة واضحة لكل درجة.",
    example: "State the formula for speed.",
    exampleAr: "اذكر معادلة السرعة.",
    answer: "Speed = Distance ÷ Time",
    answerAr: "السرعة = المسافة ÷ الزمن",
    colour: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800",
  },
  {
    word: "Describe", wordAr: "صف",
    defEn: "Give the key features or characteristics. What it looks like or what happens.",
    defAr: "أعطِ الخصائص أو السمات الرئيسية. كيف يبدو أو ماذا يحدث.",
    marksHint: "2–4 marks. Include specific detail — avoid vague words.",
    marksHintAr: "2–4 درجات. أدرج تفاصيل محددة — تجنب الكلمات المبهمة.",
    example: "Describe what happens to particles when a substance melts.",
    exampleAr: "صف ما يحدث للجسيمات عندما تذوب مادة ما.",
    answer: "Particles gain energy, vibrate more, break free from fixed positions, and move around each other.",
    answerAr: "تكتسب الجسيمات طاقة، تتذبذب أكثر، تتحرر من مواضعها الثابتة، وتتحرك حول بعضها.",
    colour: "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800",
  },
  {
    word: "Explain", wordAr: "اشرح",
    defEn: "Give reasons or causes. Use 'because' or 'therefore' to link your points.",
    defAr: "أعطِ أسباباً أو علل. استخدم 'لأن' أو 'لذلك' لربط نقاطك.",
    marksHint: "3–6 marks. Each mark usually requires a linked cause + effect.",
    marksHintAr: "3–6 درجات. كل درجة تتطلب عادةً سبباً مرتبطاً بنتيجة.",
    example: "Explain why metals conduct electricity.",
    exampleAr: "اشرح لماذا تُوصّل المعادن الكهرباء.",
    answer: "Metals have free (delocalised) electrons that can move through the structure, carrying charge.",
    answerAr: "تمتلك المعادن إلكترونات حرة يمكنها التحرك عبر البنية، ناقلةً الشحنة.",
    colour: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800",
  },
  {
    word: "Calculate", wordAr: "احسب",
    defEn: "Work out a numerical answer. Show your working — marks are given for method too.",
    defAr: "احسب إجابة رقمية. أظهر خطوات الحل — تُعطى درجات على الطريقة أيضاً.",
    marksHint: "2–4 marks. Formula → substitute → calculate → units.",
    marksHintAr: "2–4 درجات. المعادلة ← التعويض ← الحساب ← الوحدات.",
    example: "Calculate the resistance if V = 12 V and I = 3 A.",
    exampleAr: "احسب المقاومة إذا كان V = 12 فولت و I = 3 أمبير.",
    answer: "R = V ÷ I = 12 ÷ 3 = 4 Ω",
    answerAr: "R = V ÷ I = 12 ÷ 3 = 4 أوم",
    colour: "bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800",
  },
  {
    word: "Evaluate", wordAr: "قيّم",
    defEn: "Weigh up evidence and come to a conclusion. Give both sides, then make a judgement.",
    defAr: "وازن الأدلة وتوصّل إلى استنتاج. أعطِ كلا الجانبين، ثم أصدر حكماً.",
    marksHint: "4–6 marks. Must include: evidence for, evidence against, and a reasoned conclusion.",
    marksHintAr: "4–6 درجات. يجب أن تتضمن: أدلة مؤيدة، أدلة معارضة، واستنتاجاً مبرراً.",
    example: "Evaluate the use of nuclear power as an energy source.",
    exampleAr: "قيّم استخدام الطاقة النووية كمصدر للطاقة.",
    answer: "For: low CO₂, reliable. Against: radioactive waste, high cost. Conclusion: depends on energy policy priorities.",
    answerAr: "مؤيد: انخفاض CO₂، موثوق. معارض: نفايات مشعة، تكلفة عالية. الاستنتاج: يعتمد على أولويات سياسة الطاقة.",
    colour: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
  },
  {
    word: "Suggest", wordAr: "اقترح",
    defEn: "Apply your knowledge to an unfamiliar situation. More than one correct answer may exist.",
    defAr: "طبّق معرفتك على موقف غير مألوف. قد يكون هناك أكثر من إجابة صحيحة.",
    marksHint: "1–3 marks. Any reasonable, science-based suggestion scores.",
    marksHintAr: "1–3 درجات. أي اقتراح معقول قائم على العلم يحصل على درجة.",
    example: "Suggest why a patient's heart rate increased during the experiment.",
    exampleAr: "اقترح لماذا ارتفع معدل ضربات قلب المريض خلال التجربة.",
    answer: "The patient may have felt anxious, causing adrenaline release which increases heart rate.",
    answerAr: "ربما شعر المريض بالقلق، مما أدى إلى إفراز الأدرينالين الذي يرفع معدل ضربات القلب.",
    colour: "bg-teal-50 border-teal-200 dark:bg-teal-950/20 dark:border-teal-800",
  },
];

const TIME_TIPS = [
  { tipEn: "1 mark ≈ 1 minute. A 6-mark question should take ~6 minutes.", tipAr: "درجة واحدة ≈ دقيقة واحدة. سؤال من 6 درجات يستغرق ~6 دقائق." },
  { tipEn: "Read the whole paper first (5 min). Mark the questions you'll do first.", tipAr: "اقرأ الورقة كاملة أولاً (5 دقائق). ضع علامة على الأسئلة التي ستبدأ بها." },
  { tipEn: "Leave 5–10 minutes at the end to review and check units.", tipAr: "اترك 5–10 دقائق في النهاية للمراجعة والتحقق من الوحدات." },
  { tipEn: "Stuck on a question? Move on and come back. Never leave blanks.", tipAr: "عالق في سؤال؟ انتقل وعد إليه. لا تترك فراغات أبداً." },
  { tipEn: "For calculations: write formula → substitute → calculate → units.", tipAr: "للحسابات: اكتب المعادلة ← عوّض ← احسب ← الوحدات." },
  { tipEn: "For 'explain' questions: use 'because' or 'therefore' to link points.", tipAr: "لأسئلة 'اشرح': استخدم 'لأن' أو 'لذلك' لربط النقاط." },
];

const ACCESS_ARRANGEMENTS = [
  { titleEn: "Extra Time (25% or 50%)", titleAr: "وقت إضافي (25% أو 50%)", descEn: "For students with a processing speed or reading difficulty. Applied for through your school's SENCO.", descAr: "للطلاب الذين يعانون من صعوبة في سرعة المعالجة أو القراءة. يُقدَّم الطلب من خلال منسق التعليم الخاص.", whoEn: "Dyslexia, processing difficulties, physical disabilities", whoAr: "عسر القراءة، صعوبات المعالجة، الإعاقات الجسدية", icon: Clock },
  { titleEn: "Reader / Text-to-Speech", titleAr: "قارئ / تحويل النص إلى كلام", descEn: "A human reader or approved software reads questions aloud. Available for reading difficulties or visual impairments.", descAr: "يقرأ قارئ بشري أو برنامج معتمد الأسئلة بصوت عالٍ. متاح لصعوبات القراءة أو الإعاقة البصرية.", whoEn: "Blind/low vision, severe dyslexia", whoAr: "الكفيف / ضعيف البصر، عسر القراءة الشديد", icon: BookOpen },
  { titleEn: "Scribe", titleAr: "كاتب", descEn: "A person writes your answers as you dictate. You must be able to dictate clearly.", descAr: "شخص يكتب إجاباتك بينما تملي عليه. يجب أن تكون قادراً على الإملاء بوضوح.", whoEn: "Physical disabilities, severe dyslexia, ADHD with writing difficulties", whoAr: "الإعاقات الجسدية، عسر القراءة الشديد، ADHD مع صعوبات الكتابة", icon: FileText },
  { titleEn: "Word Processor", titleAr: "معالج النصوص", descEn: "Type your answers instead of handwriting. Spell-check is usually disabled.", descAr: "اكتب إجاباتك بدلاً من الكتابة اليدوية. عادةً ما يكون التدقيق الإملائي معطلاً.", whoEn: "Dyslexia, physical disabilities, ADHD", whoAr: "عسر القراءة، الإعاقات الجسدية، ADHD", icon: FileText },
  { titleEn: "Separate Room", titleAr: "غرفة منفصلة", descEn: "Sit the exam in a smaller, quieter room to reduce distractions.", descAr: "أدِّ الامتحان في غرفة أصغر وأهدأ لتقليل المشتتات.", whoEn: "ADHD, anxiety, autism", whoAr: "ADHD، القلق، التوحد", icon: Target },
];

function CommandWordPractice({ locale }: { locale: string }) {
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  const sounds = useSounds();
  const [current, setCurrent] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const cw = COMMAND_WORDS[current];

  const next = () => {
    if (current < COMMAND_WORDS.length - 1) {
      setCurrent(c => c + 1);
      setShowAnswer(false);
      sounds.navigate();
    } else {
      setDone(true);
      sounds.complete();
    }
  };

  const reset = () => { setCurrent(0); setShowAnswer(false); setScore(0); setDone(false); };

  if (done) {
    const pct = Math.round((score / COMMAND_WORDS.length) * 100);
    return (
      <div className="text-center space-y-4 py-8">
        <Trophy className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-xl font-bold">{t("Practice Complete!", "اكتملت الممارسة!")}</h3>
        <div className="text-4xl font-bold text-primary">{pct}%</div>
        <p className="text-muted-foreground text-sm">{t(`${score} of ${COMMAND_WORDS.length} command words mastered`, `${score} من ${COMMAND_WORDS.length} كلمات أوامر مُتقَنة`)}</p>
        <Progress value={pct} className="h-3 max-w-xs mx-auto" />
        <Button type="button" onClick={reset} className="gap-2"><RefreshCw className="w-4 h-4" />{t("Practice Again", "تدرب مجدداً")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{t(`${current + 1} of ${COMMAND_WORDS.length}`, `${current + 1} من ${COMMAND_WORDS.length}`)}</span>
        <span>{t(`Score: ${score}`, `النتيجة: ${score}`)}</span>
      </div>
      <Progress value={(current / COMMAND_WORDS.length) * 100} className="h-1.5" />
      <Card className={`border-2 ${cw.colour}`}>
        <CardContent className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t("Command Word", "كلمة الأمر")}</p>
            <h2 className="text-3xl font-bold font-display">{locale === "ar" ? cw.wordAr : cw.word}</h2>
          </div>
          <div className="bg-background/60 rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">{t("Definition", "التعريف")}</p>
            <p className="text-sm leading-relaxed">{locale === "ar" ? cw.defAr : cw.defEn}</p>
          </div>
          <div className="bg-background/60 rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">{t("Example question", "مثال على سؤال")}</p>
            <p className="text-sm italic">{locale === "ar" ? cw.exampleAr : cw.example}</p>
          </div>
          {!showAnswer ? (
            <Button type="button" onClick={() => { setShowAnswer(true); sounds.open(); }} className="w-full gap-2">
              <Lightbulb className="w-4 h-4" />{t("Show model answer", "أظهر الإجابة النموذجية")}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">{t("Model answer", "الإجابة النموذجية")}</p>
                <p className="text-sm text-green-800 dark:text-green-200">{locale === "ar" ? cw.answerAr : cw.answer}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground"><span className="font-semibold">💡 {t("Marks tip:", "نصيحة الدرجات:")}</span> {locale === "ar" ? cw.marksHintAr : cw.marksHint}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant="outline" onClick={() => { sounds.incorrect(); next(); }} className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20">
                  <RefreshCw className="w-4 h-4" />{t("Review again", "راجع مجدداً")}
                </Button>
                <Button type="button" onClick={() => { sounds.correct(); setScore(s => s + 1); next(); }} className="gap-2 bg-green-600 hover:bg-green-700 text-foreground">
                  <CheckCircle2 className="w-4 h-4" />{t("Got it!", "فهمت!")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ExamSkillsPage() {
  const { locale } = useProfile();
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  return (
    <div className="container py-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">{t("Exam Skills", "مهارات الامتحان")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("Master command words, manage your time, and know your access arrangements.", "أتقن كلمات الأوامر، أدِر وقتك، واعرف ترتيبات الوصول الخاصة بك.")}</p>
      </div>

      <Tabs defaultValue="command-words">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="command-words">{t("Command Words", "كلمات الأوامر")}</TabsTrigger>
          <TabsTrigger value="time">{t("Time Tips", "إدارة الوقت")}</TabsTrigger>
          <TabsTrigger value="access">{t("Access Arrangements", "ترتيبات الوصول")}</TabsTrigger>
        </TabsList>

        <TabsContent value="command-words" className="mt-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold">{t("Command Word Flashcards", "بطاقات كلمات الأوامر")}</h2>
            <p className="text-xs text-muted-foreground mt-1">{t("Read the definition and example, then reveal the model answer. Mark whether you got it.", "اقرأ التعريف والمثال، ثم اكشف الإجابة النموذجية. حدد ما إذا كنت قد فهمت.")}</p>
          </div>
          <CommandWordPractice locale={locale} />
          <div className="mt-8">
            <h3 className="text-sm font-semibold mb-3">{t("Quick Reference Table", "جدول المرجع السريع")}</h3>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold">{t("Word", "الكلمة")}</th>
                    <th className="text-left p-3 font-semibold">{t("What to do", "ماذا تفعل")}</th>
                    <th className="text-left p-3 font-semibold hidden sm:table-cell">{t("Marks", "الدرجات")}</th>
                  </tr>
                </thead>
                <tbody>
                  {COMMAND_WORDS.map((cw, i) => (
                    <tr key={cw.word} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                      <td className="p-3 font-semibold">{locale === "ar" ? cw.wordAr : cw.word}</td>
                      <td className="p-3 text-muted-foreground text-xs">{locale === "ar" ? cw.defAr : cw.defEn}</td>
                      <td className="p-3 text-xs hidden sm:table-cell">{locale === "ar" ? cw.marksHintAr : cw.marksHint}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="time" className="mt-6 space-y-4">
          <h2 className="text-base font-semibold">{t("Time Management in Exams", "إدارة الوقت في الامتحانات")}</h2>
          <div className="grid gap-3">
            {TIME_TIPS.map((tip, i) => (
              <Card key={i} className="border-l-4 border-l-primary">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-sm leading-relaxed">{locale === "ar" ? tip.tipAr : tip.tipEn}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">{t("Never leave a blank", "لا تترك فراغاً أبداً")}</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">{t("A blank scores 0. A guess or partial answer can score 1 mark. Always write something.", "الفراغ يحصل على 0. التخمين أو الإجابة الجزئية يمكن أن تحصل على درجة. اكتب دائماً شيئاً.")}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="mt-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold">{t("Access Arrangements", "ترتيبات الوصول")}</h2>
            <p className="text-xs text-muted-foreground mt-1">{t("Official exam adjustments for students with disabilities or learning differences. Apply through your school.", "تعديلات امتحانية رسمية للطلاب ذوي الإعاقات أو الاختلافات التعليمية. قدّم الطلب من خلال مدرستك.")}</p>
          </div>
          <div className="space-y-3">
            {ACCESS_ARRANGEMENTS.map((arr, i) => {
              const Icon = arr.icon;
              return (
                <Card key={i} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0"><Icon className="w-4 h-4 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{locale === "ar" ? arr.titleAr : arr.titleEn}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{locale === "ar" ? arr.descAr : arr.descEn}</p>
                      <Badge variant="secondary" className="text-[10px] mt-2">{t("Who: ", "من: ")}{locale === "ar" ? arr.whoAr : arr.whoEn}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">{t("How to apply", "كيفية التقديم")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("Speak to your school's SENCO or exam officer. You will need evidence of your need (e.g. educational psychologist report, medical letter). Apply at least 6 months before your exams.", "تحدث إلى منسق احتياجات التعليم الخاص في مدرستك أو مسؤول الامتحانات. ستحتاج إلى دليل على احتياجك. قدّم الطلب قبل 6 أشهر على الأقل من امتحاناتك.")}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
