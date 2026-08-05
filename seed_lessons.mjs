/**
 * Hikma — Full Lesson Content Seed
 * 15 lessons: 5 Math, 5 English, 5 Science
 * Each lesson has 4-6 detailed sections with full bodyEn content
 */
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Clear existing sections and lessons for topics 1-10 (IGCSE subjects 1-3)
await conn.query(`DELETE FROM sections WHERE lessonId IN (SELECT id FROM lessons WHERE topicId IN (1,2,3,4,5,6,7,8,9,10))`);
await conn.query(`DELETE FROM lessons WHERE topicId IN (1,2,3,4,5,6,7,8,9,10)`);

const lessons = [
  // ── MATHEMATICS (subjectId=1) ──────────────────────────────────────────────
  // Topic 1: Number
  {
    topicId: 1, titleEn: "Types of Numbers", titleAr: "أنواع الأعداد", order: 1, estimatedMinutes: 20,
    sections: [
      {
        order: 1, titleEn: "Natural Numbers and Integers",
        summaryEn: "Natural numbers are the counting numbers. Integers include negatives.",
        bodyEn: `**Natural numbers** are the numbers we use for counting: 1, 2, 3, 4, 5, and so on. They are always positive and never include zero or fractions. In mathematics, we write the set of natural numbers as ℕ = {1, 2, 3, 4, ...}.

**Integers** extend natural numbers by including zero and all negative whole numbers. So the set of integers is ℤ = {..., -3, -2, -1, 0, 1, 2, 3, ...}. Every natural number is also an integer, but not every integer is a natural number — for example, -5 is an integer but not a natural number.

**Why does this matter?** When you measure temperature, you need negative numbers (it can be -10°C in winter). When you count objects, you only need natural numbers. Choosing the right type of number for the right situation is a key mathematical skill.

**Key rule:** Integers are whole numbers — they have no decimal point and no fraction part. The number 3.5 is NOT an integer. The number -7 IS an integer.`,
        narrationScriptEn: "Natural numbers are the counting numbers: one, two, three, and so on. Integers go further — they include zero and negative whole numbers too. So negative seven is an integer, but three point five is not."
      },
      {
        order: 2, titleEn: "Rational and Irrational Numbers",
        summaryEn: "Rational numbers can be written as fractions. Irrational numbers cannot.",
        bodyEn: `A **rational number** is any number that can be written as a fraction p/q, where p and q are integers and q ≠ 0. This includes:
- All integers (e.g. 5 = 5/1)
- All fractions (e.g. 3/4, -2/7)
- All terminating decimals (e.g. 0.25 = 1/4)
- All recurring decimals (e.g. 0.333... = 1/3)

An **irrational number** cannot be written as a fraction. Its decimal expansion goes on forever without repeating. Famous examples include:
- **π (pi)** ≈ 3.14159265358979... (the ratio of a circle's circumference to its diameter)
- **√2** ≈ 1.41421356... (the diagonal of a unit square)
- **e** ≈ 2.71828... (the base of natural logarithms)

**A common misconception:** Students often think that because π ≈ 3.14, it equals 3.14. It does NOT — 3.14 is a rational approximation. The true value of π is irrational and cannot be written exactly as a decimal or fraction.

**Test yourself:** Is √9 rational or irrational? Think about it — √9 = 3, which is an integer, so it IS rational. Only square roots of non-perfect squares are irrational.`,
        narrationScriptEn: "A rational number can be written as a fraction — like three quarters or negative two sevenths. An irrational number cannot. Pi and the square root of two are irrational — their decimals go on forever without repeating."
      },
      {
        order: 3, titleEn: "Prime Numbers and Factors",
        summaryEn: "A prime number has exactly two factors: 1 and itself.",
        bodyEn: `A **prime number** is a whole number greater than 1 that has exactly two factors: 1 and itself. The first ten prime numbers are: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29.

**Important facts about primes:**
- 2 is the only even prime number. All other even numbers are divisible by 2, so they have at least three factors.
- 1 is NOT a prime number — it has only one factor (itself).
- There are infinitely many prime numbers. This was proved by the ancient Greek mathematician Euclid around 300 BCE.

**Prime factorisation** means writing any number as a product of its prime factors. For example:
- 12 = 2 × 2 × 3 = 2² × 3
- 60 = 2 × 2 × 3 × 5 = 2² × 3 × 5
- 100 = 2 × 2 × 5 × 5 = 2² × 5²

**Why is this useful?** Prime factorisation helps you find the Highest Common Factor (HCF) and Lowest Common Multiple (LCM) of numbers — skills you will need throughout IGCSE Mathematics.

**Method — Factor Tree:** Start with the number. Split it into any two factors. Keep splitting until every branch ends in a prime. Circle all the primes — these are your prime factors.`,
        narrationScriptEn: "A prime number has exactly two factors: one and itself. Two, three, five, seven, eleven — these are all prime. Notice that one is not prime, and two is the only even prime. Prime factorisation means writing a number as a product of its prime factors."
      },
      {
        order: 4, titleEn: "Powers and Roots",
        summaryEn: "Powers are repeated multiplication. Roots are the inverse operation.",
        bodyEn: `**Powers (Indices)** represent repeated multiplication. When we write 2³, we mean 2 × 2 × 2 = 8. The number 2 is called the **base** and 3 is called the **index** (or exponent or power).

**Key rules of indices:**
- aᵐ × aⁿ = aᵐ⁺ⁿ (multiply → add powers)
- aᵐ ÷ aⁿ = aᵐ⁻ⁿ (divide → subtract powers)
- (aᵐ)ⁿ = aᵐⁿ (power of a power → multiply)
- a⁰ = 1 for any a ≠ 0 (anything to the power zero = 1)
- a⁻¹ = 1/a (negative power = reciprocal)

**Square roots and cube roots** are the inverse of squaring and cubing:
- √25 = 5 because 5² = 25
- ∛27 = 3 because 3³ = 27
- √(-4) has no real answer — you cannot square a real number and get a negative result.

**Standard form (scientific notation)** uses powers of 10 to write very large or very small numbers:
- 3,000,000 = 3 × 10⁶
- 0.000045 = 4.5 × 10⁻⁵

In standard form, the number before × must be between 1 and 10 (including 1, not including 10).`,
        narrationScriptEn: "Powers represent repeated multiplication. Two to the power three means two times two times two, which equals eight. The rules of indices let you simplify expressions with powers. Square roots and cube roots are the inverse operations."
      }
    ]
  },

  // Topic 1: Fractions & Decimals (lesson 2)
  {
    topicId: 1, titleEn: "Fractions and Decimals", titleAr: "الكسور والأعشار", order: 2, estimatedMinutes: 25,
    sections: [
      {
        order: 1, titleEn: "Understanding Fractions",
        summaryEn: "A fraction represents a part of a whole. The top is the numerator, the bottom is the denominator.",
        bodyEn: `A **fraction** represents a part of a whole. It is written as p/q where:
- **p** is the **numerator** (how many parts you have)
- **q** is the **denominator** (how many equal parts the whole is divided into)

**Types of fractions:**
- **Proper fraction:** numerator < denominator (e.g. 3/4) — value is less than 1
- **Improper fraction:** numerator ≥ denominator (e.g. 7/3) — value is 1 or more
- **Mixed number:** a whole number and a proper fraction (e.g. 2⅓) — same as an improper fraction written differently

**Equivalent fractions** have the same value but different numerators and denominators. You create them by multiplying or dividing both top and bottom by the same number:
- 1/2 = 2/4 = 3/6 = 50/100

**Simplifying (cancelling)** means dividing numerator and denominator by their Highest Common Factor (HCF):
- 12/18 → HCF of 12 and 18 is 6 → 12÷6 / 18÷6 = 2/3

A fraction is in its **simplest form** when the HCF of numerator and denominator is 1.`,
        narrationScriptEn: "A fraction shows a part of a whole. The top number is the numerator — how many parts you have. The bottom number is the denominator — how many equal parts the whole is split into. Equivalent fractions have the same value, just written differently."
      },
      {
        order: 2, titleEn: "Adding and Subtracting Fractions",
        summaryEn: "To add or subtract fractions, you must first find a common denominator.",
        bodyEn: `To add or subtract fractions, the denominators must be the same. If they are not, you must find the **Lowest Common Multiple (LCM)** of the denominators.

**Step-by-step method:**
1. Find the LCM of the denominators
2. Convert each fraction to an equivalent fraction with the LCM as denominator
3. Add or subtract the numerators
4. Simplify if possible

**Example:** 1/3 + 1/4
- LCM of 3 and 4 = 12
- 1/3 = 4/12 and 1/4 = 3/12
- 4/12 + 3/12 = 7/12 ✓

**Example:** 5/6 - 1/4
- LCM of 6 and 4 = 12
- 5/6 = 10/12 and 1/4 = 3/12
- 10/12 - 3/12 = 7/12 ✓

**Mixed numbers:** Convert to improper fractions first, then follow the same steps.
- 2⅓ + 1¾ → 7/3 + 7/4 → 28/12 + 21/12 = 49/12 = 4 1/12

**Common mistake:** Adding denominators directly (e.g. 1/3 + 1/4 ≠ 2/7). You must NEVER add denominators.`,
        narrationScriptEn: "To add or subtract fractions, the denominators must match. Find the lowest common multiple of the denominators, convert each fraction, then add or subtract the numerators. Never add the denominators directly — that is a very common mistake."
      },
      {
        order: 3, titleEn: "Multiplying and Dividing Fractions",
        summaryEn: "Multiply fractions by multiplying across. Divide by flipping the second fraction.",
        bodyEn: `**Multiplying fractions** is straightforward — multiply numerators together and denominators together:
- a/b × c/d = (a×c)/(b×d)
- Example: 2/3 × 3/5 = 6/15 = 2/5

**Tip:** Cancel common factors before multiplying to keep numbers small:
- 4/9 × 3/8 → cancel 4 and 8 (÷4): 1/9 × 3/2 → cancel 3 and 9 (÷3): 1/3 × 1/2 = 1/6

**Dividing fractions** — use the rule "Keep, Change, Flip" (KCF):
1. **Keep** the first fraction the same
2. **Change** ÷ to ×
3. **Flip** the second fraction (take its reciprocal)

- Example: 2/3 ÷ 4/5 = 2/3 × 5/4 = 10/12 = 5/6

**Why does KCF work?** Dividing by a fraction is the same as multiplying by its reciprocal. If you divide a pizza into thirds and then ask "how many quarters fit in each third?", you are multiplying by 4/1.

**Mixed numbers:** Always convert to improper fractions before multiplying or dividing.`,
        narrationScriptEn: "To multiply fractions, multiply the numerators and multiply the denominators. To divide fractions, use Keep, Change, Flip — keep the first fraction, change division to multiplication, and flip the second fraction."
      },
      {
        order: 4, titleEn: "Converting Between Fractions and Decimals",
        summaryEn: "Divide numerator by denominator to convert fraction to decimal. Recognise recurring decimals.",
        bodyEn: `**Fraction to decimal:** Divide the numerator by the denominator.
- 3/4 = 3 ÷ 4 = 0.75 (terminating decimal)
- 1/3 = 1 ÷ 3 = 0.333... = 0.3̄ (recurring decimal — the dot above shows the repeating digit)
- 5/11 = 0.454545... = 0.4̄5̄ (two digits repeat)

**Decimal to fraction:**
- Terminating: 0.36 = 36/100 = 9/25 (simplify by dividing by HCF)
- Recurring: use algebra. Let x = 0.333..., then 10x = 3.333..., so 10x - x = 3, giving 9x = 3, so x = 3/9 = 1/3.

**Common fraction-decimal equivalents to memorise:**
| Fraction | Decimal | Percentage |
|----------|---------|------------|
| 1/2 | 0.5 | 50% |
| 1/4 | 0.25 | 25% |
| 3/4 | 0.75 | 75% |
| 1/3 | 0.333... | 33.3...% |
| 1/5 | 0.2 | 20% |
| 1/8 | 0.125 | 12.5% |

**Ordering fractions:** Convert to decimals or find a common denominator, then compare.`,
        narrationScriptEn: "To convert a fraction to a decimal, divide the numerator by the denominator. Some decimals terminate — they stop. Others recur — they repeat forever. Knowing the common equivalents like one half equals zero point five will save you time in exams."
      }
    ]
  },

  // Topic 2: Algebra — Expanding and Factorising
  {
    topicId: 2, titleEn: "Expanding and Factorising", titleAr: "التوسيع والتحليل", order: 1, estimatedMinutes: 25,
    sections: [
      {
        order: 1, titleEn: "Expanding Single Brackets",
        summaryEn: "Multiply every term inside the bracket by the term outside.",
        bodyEn: `**Expanding** means removing brackets by multiplying. When you have a single bracket, multiply every term inside by the term outside.

**Rule:** a(b + c) = ab + ac

**Examples:**
- 3(x + 4) = 3x + 12
- 5(2x - 3) = 10x - 15
- -2(x + 6) = -2x - 12 ← be careful with negatives!
- x(x + 3) = x² + 3x

**Common mistakes:**
- Forgetting to multiply ALL terms: 3(x + 4) ≠ 3x + 4
- Sign errors with negatives: -2(x + 6) ≠ -2x + 12 (should be -12, not +12)

**Simplifying after expanding:** Collect like terms (terms with the same variable and power).
- 3(x + 2) + 2(x - 1) = 3x + 6 + 2x - 2 = 5x + 4

**Like terms** have the same variable raised to the same power:
- 3x and 7x are like terms (both x¹)
- 3x and 3x² are NOT like terms (different powers)
- 3x and 3y are NOT like terms (different variables)`,
        narrationScriptEn: "Expanding means removing brackets. Multiply every term inside the bracket by the term outside. Be very careful with negative signs — a negative outside the bracket changes the sign of every term inside."
      },
      {
        order: 2, titleEn: "Expanding Double Brackets",
        summaryEn: "Use FOIL or the grid method to expand two brackets.",
        bodyEn: `When expanding two brackets, every term in the first bracket must multiply every term in the second bracket.

**FOIL method** (First, Outer, Inner, Last):
(x + 3)(x + 5)
- First: x × x = x²
- Outer: x × 5 = 5x
- Inner: 3 × x = 3x
- Last: 3 × 5 = 15
- Result: x² + 5x + 3x + 15 = **x² + 8x + 15**

**Grid method:**
|   | x  | +5  |
|---|----|-----|
| x | x² | 5x  |
|+3 | 3x | 15  |
Result: x² + 5x + 3x + 15 = x² + 8x + 15

**More examples:**
- (x - 2)(x + 7) = x² + 7x - 2x - 14 = x² + 5x - 14
- (2x + 1)(3x - 4) = 6x² - 8x + 3x - 4 = 6x² - 5x - 4
- (x + 3)² = (x + 3)(x + 3) = x² + 6x + 9

**Difference of two squares:** (a + b)(a - b) = a² - b²
- (x + 5)(x - 5) = x² - 25 (the middle terms cancel!)`,
        narrationScriptEn: "To expand double brackets, every term in the first bracket multiplies every term in the second. Use FOIL: First, Outer, Inner, Last. Then collect like terms. The difference of two squares is a special case — the middle terms always cancel."
      },
      {
        order: 3, titleEn: "Factorising — Common Factor",
        summaryEn: "Factorising is the reverse of expanding. Find the highest common factor.",
        bodyEn: `**Factorising** is the reverse of expanding — you put an expression back into brackets.

**Step 1:** Find the **Highest Common Factor (HCF)** of all terms.
**Step 2:** Write the HCF outside the bracket.
**Step 3:** Divide each term by the HCF to find what goes inside.

**Examples:**
- 6x + 9 → HCF = 3 → **3(2x + 3)**
- 10x² - 15x → HCF = 5x → **5x(2x - 3)**
- 12x²y + 8xy² → HCF = 4xy → **4xy(3x + 2y)**

**Check your answer** by expanding — you should get back to the original expression.

**Factorising with negative HCF:**
- -4x + 8 → take out -4 → **-4(x - 2)**
- This is useful when the leading term is negative.

**Why factorise?** Factorised form is often simpler to work with — especially when solving equations or simplifying fractions. The expression 5x(2x - 3) tells you immediately that x = 0 and x = 3/2 are solutions to 5x(2x - 3) = 0.`,
        narrationScriptEn: "Factorising is the reverse of expanding. Find the highest common factor of all terms, write it outside the bracket, then divide each term by it to find what goes inside. Always check by expanding back."
      },
      {
        order: 4, titleEn: "Factorising Quadratics",
        summaryEn: "Factorise x² + bx + c by finding two numbers that add to b and multiply to c.",
        bodyEn: `A **quadratic expression** has the form ax² + bx + c. When a = 1, factorising is straightforward.

**Method for x² + bx + c:**
Find two numbers that:
- **Add** to give b (the coefficient of x)
- **Multiply** to give c (the constant term)

**Example:** x² + 7x + 12
- Need two numbers that add to 7 and multiply to 12
- 3 and 4: 3 + 4 = 7 ✓ and 3 × 4 = 12 ✓
- Answer: **(x + 3)(x + 4)**

**Example:** x² - 5x + 6
- Need two numbers that add to -5 and multiply to +6
- -2 and -3: -2 + (-3) = -5 ✓ and (-2)×(-3) = 6 ✓
- Answer: **(x - 2)(x - 3)**

**Example:** x² + 2x - 15
- Need two numbers that add to +2 and multiply to -15
- +5 and -3: 5 + (-3) = 2 ✓ and 5×(-3) = -15 ✓
- Answer: **(x + 5)(x - 3)**

**Difference of two squares:** x² - 25 = (x + 5)(x - 5)
- Recognise: a² - b² = (a + b)(a - b)

**Using factorisation to solve equations:**
If (x + 3)(x + 4) = 0, then either x + 3 = 0 (so x = -3) or x + 4 = 0 (so x = -4).`,
        narrationScriptEn: "To factorise a quadratic like x squared plus seven x plus twelve, find two numbers that add to seven and multiply to twelve. Three and four work — so the answer is x plus three, times x plus four. Always check by expanding."
      }
    ]
  },

  // Topic 3: Geometry — Angles in Polygons
  {
    topicId: 3, titleEn: "Angles and Polygons", titleAr: "الزوايا والمضلعات", order: 1, estimatedMinutes: 25,
    sections: [
      {
        order: 1, titleEn: "Angle Rules",
        summaryEn: "Angles on a straight line sum to 180°. Angles around a point sum to 360°.",
        bodyEn: `Understanding angle rules is fundamental to geometry. Here are the essential rules you must know:

**Angles on a straight line** add up to **180°** (supplementary angles).
- If one angle is 65°, the other is 180° - 65° = 115°.

**Angles around a point** add up to **360°**.
- Three angles of 90°, 120°, and 150° around a point: 90 + 120 + 150 = 360° ✓

**Vertically opposite angles** are equal.
- When two lines cross, the angles opposite each other are always equal.

**Parallel line angle rules:**
- **Corresponding angles** are equal (F-shape) — also called "F angles"
- **Alternate angles** are equal (Z-shape) — also called "Z angles"
- **Co-interior angles** (same-side interior) add up to 180° — also called "C angles"

**Angles in a triangle** add up to **180°**.
- In any triangle, no matter the shape or size, the three interior angles always sum to 180°.

**Angles in a quadrilateral** add up to **360°**.
- A quadrilateral has 4 sides and 4 angles. The sum is always 360°.

**Exterior angle of a triangle** equals the sum of the two non-adjacent interior angles.
- If two interior angles are 40° and 70°, the exterior angle at the third vertex is 40° + 70° = 110°.`,
        narrationScriptEn: "Angles on a straight line add to one hundred and eighty degrees. Angles around a point add to three hundred and sixty degrees. Vertically opposite angles are equal. In a triangle, the three angles always add to one hundred and eighty degrees."
      },
      {
        order: 2, titleEn: "Interior and Exterior Angles of Polygons",
        summaryEn: "The sum of interior angles of an n-sided polygon is (n-2) × 180°.",
        bodyEn: `A **polygon** is a closed shape with straight sides. The number of sides determines the sum of its interior angles.

**Formula:** Sum of interior angles = **(n - 2) × 180°**
where n is the number of sides.

| Polygon | Sides (n) | Sum of interior angles |
|---------|-----------|----------------------|
| Triangle | 3 | (3-2) × 180° = 180° |
| Quadrilateral | 4 | (4-2) × 180° = 360° |
| Pentagon | 5 | (5-2) × 180° = 540° |
| Hexagon | 6 | (6-2) × 180° = 720° |
| Octagon | 8 | (8-2) × 180° = 1080° |

**Regular polygons** have all sides equal and all angles equal.
- Each interior angle of a regular polygon = (n-2) × 180° ÷ n
- Regular hexagon: 720° ÷ 6 = 120° per angle

**Exterior angles:**
- Each exterior angle of a regular polygon = 360° ÷ n
- The sum of ALL exterior angles of ANY polygon = 360°
- Regular pentagon: each exterior angle = 360° ÷ 5 = 72°

**Interior + Exterior angle at the same vertex = 180°** (they form a straight line).`,
        narrationScriptEn: "The sum of interior angles of a polygon with n sides is n minus two, times one hundred and eighty degrees. For a regular polygon, divide this total by n to find each angle. The sum of all exterior angles of any polygon is always three hundred and sixty degrees."
      },
      {
        order: 3, titleEn: "Properties of Special Quadrilaterals",
        summaryEn: "Square, rectangle, rhombus, parallelogram, trapezium — each has unique properties.",
        bodyEn: `You must know the properties of these special quadrilaterals:

**Square:**
- 4 equal sides, 4 right angles (90°)
- Diagonals are equal, bisect each other at 90°, and bisect the angles
- All properties of a rectangle AND a rhombus

**Rectangle:**
- Opposite sides equal and parallel, 4 right angles
- Diagonals are equal and bisect each other (but not at 90°)

**Rhombus:**
- 4 equal sides, opposite angles equal
- Diagonals bisect each other at 90° and bisect the angles
- Opposite sides are parallel

**Parallelogram:**
- Opposite sides equal and parallel, opposite angles equal
- Diagonals bisect each other (but are not equal and not at 90°)
- Co-interior angles (between parallel sides) add to 180°

**Trapezium:**
- Exactly one pair of parallel sides
- Isosceles trapezium: non-parallel sides equal, base angles equal, diagonals equal

**Kite:**
- Two pairs of adjacent equal sides
- One pair of equal angles (between unequal sides)
- Diagonals cross at 90°; one diagonal bisects the other

**Memory tip:** A square is a special rectangle, which is a special parallelogram. Properties pass down the hierarchy.`,
        narrationScriptEn: "A square has four equal sides and four right angles. A rectangle has four right angles but sides don't all need to be equal. A rhombus has four equal sides but angles aren't necessarily ninety degrees. A parallelogram has opposite sides parallel and equal."
      },
      {
        order: 4, titleEn: "Pythagoras' Theorem",
        summaryEn: "In a right-angled triangle: a² + b² = c², where c is the hypotenuse.",
        bodyEn: `**Pythagoras' Theorem** applies to right-angled triangles. It states:

**a² + b² = c²**

where c is the **hypotenuse** (the longest side, opposite the right angle) and a and b are the other two sides.

**Finding the hypotenuse:**
- If a = 3 and b = 4: c² = 3² + 4² = 9 + 16 = 25, so c = √25 = **5**
- The 3-4-5 triangle is a famous Pythagorean triple.

**Finding a shorter side:**
- If c = 13 and a = 5: b² = c² - a² = 169 - 25 = 144, so b = √144 = **12**

**Common Pythagorean triples** (whole number solutions):
- 3, 4, 5
- 5, 12, 13
- 8, 15, 17
- 7, 24, 25

**Is a triangle right-angled?** Check if a² + b² = c². If yes, it is right-angled.
- Is 6, 8, 10 a right-angled triangle? 6² + 8² = 36 + 64 = 100 = 10² ✓ Yes!

**Applications:** Pythagoras is used to find distances, heights, and lengths in real-world problems — from construction to navigation to screen sizes.

**Important:** Always identify the hypotenuse first (it is opposite the right angle and is always the longest side).`,
        narrationScriptEn: "Pythagoras' theorem says: a squared plus b squared equals c squared, where c is the hypotenuse — the longest side, opposite the right angle. To find the hypotenuse, add the squares of the other two sides and take the square root."
      }
    ]
  },

  // Topic 4: Statistics — Mean, Median, Mode
  {
    topicId: 4, titleEn: "Averages and Range", titleAr: "المتوسطات والمدى", order: 1, estimatedMinutes: 20,
    sections: [
      {
        order: 1, titleEn: "Mean, Median, Mode and Range",
        summaryEn: "Four measures that describe a data set: mean (average), median (middle), mode (most common), range (spread).",
        bodyEn: `When analysing data, we use **measures of average** (central tendency) and **measures of spread**.

**Mean** = Sum of all values ÷ Number of values
- Data: 4, 7, 2, 9, 3 → Sum = 25, Count = 5 → Mean = 25 ÷ 5 = **5**
- The mean uses every value, so it is affected by extreme values (outliers).

**Median** = The middle value when data is arranged in order
- Odd count: 2, 3, 4, 7, 9 → Middle value = **4**
- Even count: 2, 3, 4, 7, 9, 10 → Average of 4th and 5th values = (4+7)/2 = **5.5**
- The median is not affected by extreme values — use it when data has outliers.

**Mode** = The value that appears most often
- 2, 3, 3, 4, 7, 9, 9, 9 → Mode = **9** (appears 3 times)
- A data set can have no mode, one mode, or multiple modes (bimodal, trimodal).

**Range** = Largest value − Smallest value
- 2, 3, 4, 7, 9 → Range = 9 - 2 = **7**
- Range measures the spread of the data. A large range means data is spread out.

**Which average to use?**
- Mean: when data is evenly spread, no extreme values
- Median: when data has outliers or is skewed
- Mode: for categorical data (e.g. most popular colour)`,
        narrationScriptEn: "The mean is the sum of all values divided by how many there are. The median is the middle value when data is sorted. The mode is the most common value. The range tells you how spread out the data is."
      },
      {
        order: 2, titleEn: "Frequency Tables and Grouped Data",
        summaryEn: "Estimate the mean from a frequency table using midpoints of class intervals.",
        bodyEn: `**Frequency tables** organise data by showing how many times each value (or group of values) occurs.

**Mean from a frequency table:**
- Multiply each value by its frequency: f × x
- Sum all f × x values
- Divide by total frequency: Mean = Σ(f × x) ÷ Σf

**Example:**
| Score (x) | Frequency (f) | f × x |
|-----------|---------------|-------|
| 2 | 3 | 6 |
| 4 | 5 | 20 |
| 6 | 2 | 12 |
| **Total** | **10** | **38** |

Mean = 38 ÷ 10 = **3.8**

**Grouped data** — when data is in class intervals (e.g. 10 ≤ x < 20):
- Use the **midpoint** of each class interval as the representative value
- Midpoint of 10 ≤ x < 20 is (10 + 20) ÷ 2 = 15
- Calculate mean using midpoints: Mean = Σ(f × midpoint) ÷ Σf
- This gives an **estimate** of the mean (not exact, because we don't know exact values)

**Modal class** = the class interval with the highest frequency
**Median class** = the class interval containing the middle value (find using cumulative frequency)`,
        narrationScriptEn: "In a frequency table, multiply each value by its frequency, add them all up, then divide by the total frequency. For grouped data, use the midpoint of each class interval. This gives an estimate of the mean."
      },
      {
        order: 3, titleEn: "Representing Data: Charts and Graphs",
        summaryEn: "Bar charts, pie charts, histograms, and scatter graphs each serve different purposes.",
        bodyEn: `Choosing the right chart for your data is an important skill.

**Bar chart:** Used for discrete or categorical data.
- Bars are separated (gaps between them)
- Height of bar = frequency
- Can be vertical or horizontal

**Pie chart:** Shows proportions of a whole.
- Each sector angle = (frequency ÷ total) × 360°
- Good for showing relative sizes, not actual values

**Histogram:** Used for continuous grouped data.
- No gaps between bars (data is continuous)
- The y-axis shows **frequency density**, not frequency
- Frequency density = Frequency ÷ Class width
- Area of bar = Frequency (not height!)

**Scatter graph:** Shows the relationship between two variables.
- Each point represents one data item with two measurements
- **Positive correlation:** as x increases, y increases
- **Negative correlation:** as x increases, y decreases
- **No correlation:** no pattern
- **Line of best fit:** drawn through the middle of the points, used to make predictions

**Stem-and-leaf diagram:** Shows the shape of data while keeping original values.
- Stems are the tens digits, leaves are the units digits
- Back-to-back stem-and-leaf compares two data sets

**Cumulative frequency graph:** Used to find median, quartiles, and percentiles.
- Plot cumulative frequency against upper class boundary
- S-shaped curve (ogive)`,
        narrationScriptEn: "Bar charts work for discrete data. Histograms are for continuous grouped data — and the y-axis shows frequency density, not frequency. Scatter graphs show the relationship between two variables. Pie charts show proportions of a whole."
      }
    ]
  },

  // ── ENGLISH LANGUAGE (subjectId=2) ────────────────────────────────────────
  // Topic 5: Reading & Comprehension
  {
    topicId: 5, titleEn: "Reading Comprehension Skills", titleAr: "مهارات الفهم القرائي", order: 1, estimatedMinutes: 25,
    sections: [
      {
        order: 1, titleEn: "Skimming and Scanning",
        summaryEn: "Skimming gives you the main idea quickly. Scanning helps you find specific information.",
        bodyEn: `**Skimming** and **scanning** are two essential reading strategies that help you read efficiently — especially under exam conditions.

**Skimming** means reading quickly to get the general idea of a text without reading every word.
- Read the title, headings, and subheadings
- Read the first and last sentences of each paragraph
- Look at any images, captions, or highlighted text
- Goal: understand the overall topic and structure in 30-60 seconds

**When to skim:** When you first receive a reading passage, before answering any questions. This gives you a mental map of the text.

**Scanning** means searching for specific information — a name, date, number, or keyword.
- Move your eyes quickly down the page
- Look for capital letters, numbers, or keywords from the question
- Do NOT read every word — let your eyes jump to what matters
- Goal: locate the answer quickly without re-reading the whole text

**When to scan:** When a question asks for a specific fact ("What year did...?", "According to the text, how many...?")

**Practice strategy:**
1. Skim the whole passage first (1 minute)
2. Read each question carefully
3. Scan for the relevant section
4. Read that section carefully to find the precise answer

**Exam tip:** In IGCSE English, you are never expected to know information outside the text. Every answer is in the passage — your job is to find it and express it clearly.`,
        narrationScriptEn: "Skimming means reading quickly to get the main idea. Scanning means searching for specific information. In an exam, skim the whole passage first to build a mental map, then scan for the section that answers each question."
      },
      {
        order: 2, titleEn: "Identifying the Writer's Purpose and Audience",
        summaryEn: "Every text has a purpose (to inform, persuade, entertain) and an intended audience.",
        bodyEn: `Every piece of writing has a **purpose** — a reason why the writer wrote it — and an **audience** — the people the writer intended to read it.

**Common purposes:**
- **To inform:** gives facts and information (news articles, textbooks, reports)
- **To persuade:** tries to change your opinion or behaviour (adverts, opinion pieces, speeches)
- **To entertain:** aims to engage and amuse (fiction, travel writing, personal essays)
- **To advise:** gives guidance on what to do (leaflets, how-to guides)
- **To describe:** creates a vivid picture (travel writing, descriptive essays)

A text can have more than one purpose — a charity leaflet might inform AND persuade.

**Identifying the audience:**
- Age: Is the vocabulary simple or complex? Are there references to childhood or adult life?
- Background knowledge: Does the writer explain basic terms or assume the reader knows them?
- Interests: What topics are covered? What examples are used?
- Tone: Is it formal (professional audience) or informal (friends/peers)?

**How purpose affects language:**
- Informative texts use facts, statistics, technical vocabulary, neutral tone
- Persuasive texts use rhetorical questions, emotive language, repetition, direct address ("you")
- Entertaining texts use vivid description, humour, personal anecdotes, varied sentence structure

**Exam question type:** "What is the writer's purpose in this text? How do you know?" — Always give evidence from the text.`,
        narrationScriptEn: "Every text has a purpose — to inform, persuade, entertain, or advise — and an intended audience. Informative texts use facts and neutral tone. Persuasive texts use rhetorical questions and emotive language. Always support your answer with evidence from the text."
      },
      {
        order: 3, titleEn: "Inference and Implicit Meaning",
        summaryEn: "Inference means reading between the lines — understanding what is implied but not directly stated.",
        bodyEn: `**Inference** is one of the most important reading skills. It means understanding what a writer implies — what they suggest without saying directly.

**Explicit information** is directly stated in the text: "The boy was cold."
**Implicit information** requires inference: "The boy pulled his coat tighter and his teeth chattered." → We infer he is cold.

**How to make inferences:**
1. Read the text carefully
2. Ask: "What does this suggest? What can I work out from this?"
3. Use evidence from the text to support your inference
4. Express your inference clearly: "This suggests that...", "This implies...", "We can infer that..."

**Example:**
Text: *"Sarah glanced at her watch for the third time. The waiter had still not appeared."*
Inference: Sarah is becoming impatient or frustrated. She has been waiting a long time.

**Connotation:** Words carry meanings beyond their dictionary definition.
- "Slim" and "scrawny" both mean thin, but "slim" has positive connotations while "scrawny" suggests unhealthy thinness.
- Writers choose words deliberately for their connotations.

**Tone:** The writer's attitude towards their subject.
- Formal, informal, humorous, serious, sarcastic, sympathetic, critical, celebratory
- Identify tone by looking at word choice, sentence structure, and what the writer emphasises.

**Exam tip:** When asked to infer, always quote the word or phrase from the text and then explain what it suggests. "The word '...' suggests that..."`,
        narrationScriptEn: "Inference means reading between the lines — understanding what is implied but not directly stated. Look for clues in the writer's word choices. Always quote the text and explain what it suggests. Use phrases like 'this implies' or 'we can infer that'."
      },
      {
        order: 4, titleEn: "Summarising and Selecting Information",
        summaryEn: "Summarising means identifying the most important points and expressing them concisely.",
        bodyEn: `**Summarising** is the skill of identifying the most important information from a text and expressing it concisely in your own words.

**Why summarise?** In IGCSE English, you will be asked to select and organise information from one or more texts. This tests whether you understand what is important and can express it clearly.

**Steps for effective summarising:**
1. Read the question carefully — what specific information are you looking for?
2. Skim the text to find the relevant sections
3. Identify the key points (usually one per paragraph)
4. Write the points in your own words — do not copy chunks of text
5. Check you have answered the question, not just retold the whole passage

**What to include:**
- Main ideas and key facts
- Important examples that illustrate the main points
- Any contrasts or changes mentioned

**What to leave out:**
- Repetition
- Minor details
- Examples that don't add new information
- The writer's opinions (unless asked for)

**Using your own words:** Paraphrasing shows you understand the text. Simply copying phrases from the passage does not demonstrate comprehension.

**Exam tip:** For summary questions, bullet points are often acceptable and save time. Aim for clear, concise sentences. Quality matters more than quantity.`,
        narrationScriptEn: "Summarising means picking out the most important points and expressing them concisely in your own words. Read the question first to know what to look for. Include main ideas and key facts. Leave out repetition and minor details."
      }
    ]
  },

  // Topic 6: Writing Skills
  {
    topicId: 6, titleEn: "Effective Writing Skills", titleAr: "مهارات الكتابة الفعّالة", order: 1, estimatedMinutes: 30,
    sections: [
      {
        order: 1, titleEn: "Planning Your Writing",
        summaryEn: "Good writing starts with a clear plan. Organise your ideas before you write.",
        bodyEn: `**Planning** is the foundation of effective writing. Even spending just 5 minutes planning will significantly improve the quality of your work.

**Why plan?**
- Prevents you from running out of ideas mid-essay
- Ensures your writing is logically structured
- Helps you stay focused on the question
- Makes your writing more coherent and convincing

**Planning methods:**

**Mind map:** Write your main topic in the centre. Branch out with main ideas. Add supporting details to each branch. Good for creative and descriptive writing.

**Numbered list:** List your main points in the order you will write them. Add brief notes for evidence or examples. Good for essays and reports.

**Paragraph outline:**
- Introduction: hook + context + thesis/purpose
- Paragraph 1: Point + Evidence + Explanation
- Paragraph 2: Point + Evidence + Explanation
- Paragraph 3: Point + Evidence + Explanation
- Conclusion: Summary + final thought

**PEEL structure for paragraphs:**
- **P**oint: state your main idea
- **E**vidence: quote or example from the text/your knowledge
- **E**xplanation: explain how the evidence supports your point
- **L**ink: connect back to the question or to the next paragraph

**Exam tip:** In timed exams, plan for 5-10 minutes, write for 35-40 minutes, check for 5 minutes. A planned essay always outperforms an unplanned one.`,
        narrationScriptEn: "Good writing starts with a plan. Even five minutes of planning will improve your work significantly. Use a mind map or numbered list to organise your ideas. Structure each paragraph with a clear point, evidence, explanation, and link."
      },
      {
        order: 2, titleEn: "Descriptive Writing Techniques",
        summaryEn: "Use the five senses, figurative language, and varied sentence structure to create vivid descriptions.",
        bodyEn: `**Descriptive writing** creates a vivid picture in the reader's mind. The best descriptive writing engages all five senses and uses language precisely.

**The five senses:**
- **Sight:** colours, shapes, light, movement ("The amber streetlight cast long shadows across the wet pavement")
- **Sound:** volume, pitch, rhythm ("The distant rumble of thunder rolled across the valley")
- **Touch/Feel:** texture, temperature, weight ("The rough bark scraped against her palm")
- **Smell:** pleasant, unpleasant, familiar ("The sharp tang of salt and seaweed filled the air")
- **Taste:** sweet, bitter, sharp ("The lemon's sourness made her eyes water")

**Figurative language:**
- **Simile:** comparison using "like" or "as" → "Her eyes were like chips of ice"
- **Metaphor:** direct comparison → "The city was a sleeping giant"
- **Personification:** giving human qualities to non-human things → "The wind whispered through the trees"
- **Alliteration:** repetition of initial consonant sounds → "The silver sea shimmered"
- **Onomatopoeia:** words that sound like what they describe → "The leaves rustled", "The door creaked"

**Sentence variety:**
- Short sentences create tension: "She stopped. She listened. Nothing."
- Long sentences create flow and atmosphere: "The sun sank slowly beneath the horizon, painting the sky in shades of amber and rose."
- Vary your sentence openings: start with adverbs, prepositional phrases, or subordinate clauses.

**Show, don't tell:** Instead of "He was angry", write "His jaw tightened and his knuckles whitened around the steering wheel."`,
        narrationScriptEn: "Descriptive writing engages all five senses. Use similes, metaphors, and personification to create vivid images. Vary your sentence length — short sentences create tension, longer ones create atmosphere. Show emotions through actions rather than stating them directly."
      },
      {
        order: 3, titleEn: "Persuasive Writing Techniques",
        summaryEn: "Use rhetorical devices, evidence, and structure to persuade your reader.",
        bodyEn: `**Persuasive writing** aims to change the reader's opinion or encourage them to take action. Effective persuasion combines logical argument with emotional appeal.

**Rhetorical devices (AFOREST):**
- **A**necdote: a brief personal story that illustrates your point
- **F**act: verifiable information that supports your argument
- **O**pinion: a stated viewpoint, presented confidently
- **R**hetorical question: a question that makes the reader think ("Surely we can do better?")
- **E**motive language: words that trigger an emotional response ("devastating", "heartbreaking")
- **S**tatistic: numbers that add credibility ("Over 8 million tonnes of plastic enter the ocean every year")
- **T**ricolon (rule of three): three words or phrases for emphasis ("We need action, commitment, and change")

**Structure of a persuasive text:**
1. **Hook:** Grab attention immediately (startling fact, rhetorical question, bold statement)
2. **Thesis:** State your position clearly
3. **Arguments:** Present 3-4 points, each in its own paragraph, with evidence
4. **Counter-argument + rebuttal:** Acknowledge the opposing view, then dismiss it
5. **Conclusion:** Restate your position powerfully, call to action

**Direct address:** Using "you" makes the reader feel personally involved.
**Repetition:** Repeating key words or phrases reinforces your message.
**Inclusive language:** "We" and "us" creates a sense of shared responsibility.

**Exam tip:** In persuasive writing, your personal opinion does not matter — what matters is how convincingly you argue your assigned position.`,
        narrationScriptEn: "Persuasive writing uses rhetorical devices to change the reader's mind. Remember AFOREST: Anecdote, Fact, Opinion, Rhetorical question, Emotive language, Statistic, Tricolon. Structure your argument clearly, acknowledge the opposing view, then dismiss it."
      },
      {
        order: 4, titleEn: "Grammar and Punctuation",
        summaryEn: "Accurate grammar and punctuation make your writing clear and professional.",
        bodyEn: `**Grammar and punctuation** are the tools that make your writing clear, accurate, and professional. Errors distract the reader and reduce the impact of your ideas.

**Essential punctuation:**
- **Full stop (.)** ends a sentence. Every sentence must end with one.
- **Comma (,)** separates items in a list, joins clauses, or adds a pause.
- **Apostrophe (')** shows possession (the girl's bag) or contraction (don't = do not).
- **Colon (:)** introduces a list or explanation.
- **Semicolon (;)** joins two closely related independent clauses.
- **Exclamation mark (!)** shows strong emotion — use sparingly.
- **Question mark (?)** ends a direct question.
- **Speech marks (" ")** enclose direct speech.

**Common grammar errors to avoid:**
- **Sentence fragments:** "Running down the street." (no subject or main verb) → Fix: "She was running down the street."
- **Run-on sentences:** "I went to the shop I bought bread." → Fix: "I went to the shop. I bought bread." or "I went to the shop and bought bread."
- **Subject-verb agreement:** "The group of students are..." → Fix: "The group of students is..." (group is singular)
- **Tense consistency:** Don't switch between past and present tense without reason.

**Varying sentence structure:**
- Simple: one main clause ("The dog barked.")
- Compound: two main clauses joined by a conjunction ("The dog barked and the cat hid.")
- Complex: a main clause and a subordinate clause ("Although the dog barked, the cat stayed calm.")`,
        narrationScriptEn: "Accurate punctuation makes your writing clear. Every sentence needs a full stop. Apostrophes show possession or contraction. Avoid sentence fragments and run-on sentences. Vary your sentence structure — simple, compound, and complex sentences each serve different purposes."
      }
    ]
  },

  // Topic 7: Speaking & Listening
  {
    topicId: 7, titleEn: "Speaking and Listening", titleAr: "التحدث والاستماع", order: 1, estimatedMinutes: 20,
    sections: [
      {
        order: 1, titleEn: "Formal and Informal Communication",
        summaryEn: "Adjust your language and tone depending on your audience and purpose.",
        bodyEn: `**Register** refers to the level of formality in your language. Choosing the right register for the right situation is a crucial communication skill.

**Formal register** is used in:
- Job interviews, presentations, debates
- Writing to teachers, employers, or officials
- Academic essays and reports
- Features: standard grammar, full sentences, no slang, polite vocabulary, third person or first person singular

**Informal register** is used in:
- Conversations with friends and family
- Text messages, social media
- Casual emails to people you know well
- Features: contractions (don't, can't), slang, colloquialisms, shorter sentences, first person

**Adapting to your audience:**
- Age: simpler vocabulary for younger audiences, technical terms for experts
- Relationship: more formal with strangers and authority figures
- Purpose: more formal when persuading or informing, more informal when entertaining

**Non-verbal communication:**
- **Eye contact:** shows confidence and engagement
- **Posture:** standing straight projects confidence; slouching suggests disinterest
- **Gestures:** can emphasise points but should not be distracting
- **Pace and volume:** speak clearly, not too fast, loud enough to be heard
- **Pausing:** a deliberate pause can emphasise a point more powerfully than words

**Active listening:**
- Maintain eye contact with the speaker
- Nod to show understanding
- Do not interrupt
- Ask clarifying questions when appropriate
- Summarise what you have heard to check understanding`,
        narrationScriptEn: "Register is the level of formality in your language. Use formal register in interviews, presentations, and academic writing. Use informal register with friends and family. Non-verbal communication — eye contact, posture, pace — is just as important as the words you use."
      }
    ]
  },

  // ── SCIENCE (subjectId=3) ──────────────────────────────────────────────────
  // Topic 8: Biology — Cells
  {
    topicId: 8, titleEn: "Cell Biology", titleAr: "علم الخلايا", order: 1, estimatedMinutes: 25,
    sections: [
      {
        order: 1, titleEn: "Animal and Plant Cells",
        summaryEn: "All living things are made of cells. Animal and plant cells share some features but differ in key ways.",
        bodyEn: `The **cell** is the basic unit of life. Every living organism — from a bacterium to a blue whale — is made of cells. Some organisms consist of just one cell (unicellular), while others have trillions of cells (multicellular).

**Animal cell structure:**
- **Cell membrane:** controls what enters and leaves the cell (selectively permeable)
- **Cytoplasm:** jelly-like fluid where chemical reactions occur
- **Nucleus:** contains DNA and controls cell activities
- **Mitochondria:** site of aerobic respiration — produces energy (ATP)
- **Ribosomes:** site of protein synthesis

**Plant cell structure** — has all of the above, PLUS:
- **Cell wall:** made of cellulose, provides rigid support and shape
- **Chloroplasts:** contain chlorophyll, site of photosynthesis
- **Vacuole (large, permanent):** filled with cell sap, helps maintain cell shape by turgor pressure

**Key differences:**
| Feature | Animal Cell | Plant Cell |
|---------|-------------|------------|
| Cell wall | ✗ | ✓ (cellulose) |
| Chloroplasts | ✗ | ✓ (in green parts) |
| Large vacuole | ✗ (small/none) | ✓ |
| Shape | Irregular | Regular (fixed) |

**Specialised cells:** Cells are adapted for their function.
- Red blood cells: no nucleus, biconcave shape → maximises surface area for oxygen transport
- Nerve cells: long axon → transmits electrical signals over long distances
- Root hair cells: long extension → increases surface area for water absorption`,
        narrationScriptEn: "All living things are made of cells. Animal cells have a membrane, cytoplasm, nucleus, mitochondria, and ribosomes. Plant cells have all of these plus a cell wall, chloroplasts, and a large vacuole. These extra structures give plants their rigid shape and allow photosynthesis."
      },
      {
        order: 2, titleEn: "Cell Division: Mitosis",
        summaryEn: "Mitosis produces two genetically identical daughter cells for growth and repair.",
        bodyEn: `**Mitosis** is a type of cell division that produces two genetically identical daughter cells. It is used for:
- Growth (increasing the number of cells)
- Repair (replacing damaged or dead cells)
- Asexual reproduction (in some organisms)

**Stages of mitosis:**
1. **Interphase** (preparation): DNA is replicated. The cell grows and prepares for division.
2. **Prophase:** Chromosomes condense and become visible. The nuclear envelope breaks down.
3. **Metaphase:** Chromosomes line up along the middle of the cell.
4. **Anaphase:** Chromatids are pulled to opposite poles of the cell.
5. **Telophase:** Nuclear envelopes reform around each set of chromosomes.
6. **Cytokinesis:** The cytoplasm divides, producing two daughter cells.

**Key result:** Each daughter cell has the same number of chromosomes as the parent cell and is genetically identical to it.

**Human body cells** have 46 chromosomes (23 pairs). After mitosis, each daughter cell also has 46 chromosomes.

**Cancer** occurs when mitosis is uncontrolled — cells divide repeatedly without stopping, forming a tumour.

**Stem cells** are undifferentiated cells that can divide by mitosis and then differentiate into specialised cell types. They have important medical applications in treating diseases.`,
        narrationScriptEn: "Mitosis produces two genetically identical daughter cells. It is used for growth and repair. The key stages are interphase, prophase, metaphase, anaphase, telophase, and cytokinesis. Each daughter cell has the same number of chromosomes as the parent."
      },
      {
        order: 3, titleEn: "Diffusion, Osmosis and Active Transport",
        summaryEn: "Substances move in and out of cells by diffusion, osmosis, or active transport.",
        bodyEn: `Cells constantly exchange substances with their environment. There are three main transport mechanisms:

**Diffusion** is the net movement of particles from an area of high concentration to an area of low concentration, down a concentration gradient. It requires no energy.
- Examples: oxygen diffuses from the lungs into the blood; carbon dioxide diffuses from cells into the blood
- Factors affecting rate: concentration gradient (steeper = faster), temperature (higher = faster), surface area (larger = faster), distance (shorter = faster)

**Osmosis** is the movement of water molecules through a selectively permeable membrane from a region of high water concentration (dilute solution) to a region of low water concentration (concentrated solution).
- Osmosis is a special type of diffusion — only water moves, and only through a selectively permeable membrane
- **Turgid** plant cells: water enters by osmosis → cell swells → cell wall prevents bursting → firm (turgor pressure)
- **Plasmolysed** plant cells: water leaves by osmosis → cytoplasm shrinks away from cell wall → plant wilts

**Active transport** moves substances against a concentration gradient (from low to high concentration). It requires energy (ATP) and carrier proteins.
- Examples: absorption of glucose from the gut into the blood; absorption of mineral ions by root hair cells
- Unlike diffusion, active transport can move substances "uphill" — against the concentration gradient

**Summary table:**
| | Diffusion | Osmosis | Active Transport |
|---|---|---|---|
| Energy needed? | No | No | Yes |
| Direction | High → Low | High water → Low water | Low → High |
| Membrane needed? | No | Yes (selectively permeable) | Yes |`,
        narrationScriptEn: "Diffusion moves particles from high to low concentration — no energy needed. Osmosis is the movement of water through a selectively permeable membrane from a dilute to a concentrated solution. Active transport moves substances against the concentration gradient and requires energy."
      },
      {
        order: 4, titleEn: "Enzymes",
        summaryEn: "Enzymes are biological catalysts that speed up chemical reactions in living organisms.",
        bodyEn: `**Enzymes** are proteins that act as biological catalysts — they speed up chemical reactions without being used up themselves.

**Lock and key model:**
- Each enzyme has an **active site** with a specific shape
- Only a substrate with a complementary shape can fit into the active site
- This forms an **enzyme-substrate complex**
- The reaction occurs and the products are released
- The enzyme is unchanged and can be used again

**Factors affecting enzyme activity:**

**Temperature:**
- As temperature increases, enzyme activity increases (more kinetic energy → more collisions)
- At the **optimum temperature**, activity is maximum
- Above the optimum, the enzyme **denatures** — the active site changes shape permanently and the enzyme stops working
- Human enzymes have an optimum around 37°C (body temperature)

**pH:**
- Each enzyme has an optimum pH
- Pepsin (stomach enzyme) works best at pH 2 (acidic)
- Amylase (saliva enzyme) works best at pH 7 (neutral)
- Extreme pH causes denaturation

**Substrate concentration:**
- More substrate → more enzyme-substrate complexes → faster reaction
- Eventually, all active sites are occupied (enzyme is saturated) → rate cannot increase further

**Important enzymes:**
- Amylase: breaks down starch → maltose (in mouth and small intestine)
- Protease: breaks down proteins → amino acids (in stomach and small intestine)
- Lipase: breaks down fats → fatty acids and glycerol (in small intestine)`,
        narrationScriptEn: "Enzymes are biological catalysts — they speed up reactions without being used up. Each enzyme has an active site that fits only one specific substrate, like a lock and key. Temperature and pH affect enzyme activity. Too high a temperature or extreme pH causes denaturation — the active site changes shape permanently."
      }
    ]
  },

  // Topic 9: Chemistry — Atoms & Elements
  {
    topicId: 9, titleEn: "Atoms, Elements and the Periodic Table", titleAr: "الذرات والعناصر والجدول الدوري", order: 1, estimatedMinutes: 25,
    sections: [
      {
        order: 1, titleEn: "Atomic Structure",
        summaryEn: "Atoms consist of a nucleus (protons and neutrons) surrounded by electrons in shells.",
        bodyEn: `Everything around us is made of **atoms** — the smallest particles of an element that retain the chemical properties of that element.

**Structure of an atom:**
- **Nucleus** at the centre, containing:
  - **Protons:** positive charge (+1), relative mass 1
  - **Neutrons:** no charge (0), relative mass 1
- **Electrons** orbit the nucleus in shells (energy levels):
  - Negative charge (-1), relative mass ≈ 0 (negligible)

**Key numbers:**
- **Atomic number (Z):** number of protons in the nucleus. This defines the element.
- **Mass number (A):** total number of protons + neutrons
- **Number of neutrons** = Mass number − Atomic number

**In a neutral atom:** number of protons = number of electrons (so the atom has no overall charge)

**Electron shells:**
- Shell 1 (closest to nucleus): maximum 2 electrons
- Shell 2: maximum 8 electrons
- Shell 3: maximum 8 electrons (for the first 20 elements)

**Electronic configuration** shows how electrons are arranged:
- Carbon (Z=6): 2,4 (2 in shell 1, 4 in shell 2)
- Sodium (Z=11): 2,8,1
- Calcium (Z=20): 2,8,8,2

**Isotopes** are atoms of the same element with the same number of protons but different numbers of neutrons.
- Carbon-12 (⁶¹²C): 6 protons, 6 neutrons
- Carbon-14 (⁶¹⁴C): 6 protons, 8 neutrons
- Same element, same chemical properties, different mass`,
        narrationScriptEn: "Atoms have a nucleus containing protons and neutrons, surrounded by electrons in shells. The atomic number tells you how many protons there are — this defines the element. In a neutral atom, the number of electrons equals the number of protons."
      },
      {
        order: 2, titleEn: "The Periodic Table",
        summaryEn: "The Periodic Table organises elements by atomic number into periods and groups.",
        bodyEn: `The **Periodic Table** is one of the most important tools in chemistry. It organises all known elements by their atomic number and groups elements with similar properties together.

**Structure:**
- **Periods** (horizontal rows): elements in the same period have the same number of electron shells
  - Period 1: 2 elements (H, He)
  - Period 2: 8 elements (Li to Ne)
  - Period 3: 8 elements (Na to Ar)
- **Groups** (vertical columns): elements in the same group have the same number of electrons in their outer shell → similar chemical properties

**Key groups:**
- **Group 1 — Alkali metals** (Li, Na, K...): 1 outer electron, very reactive, react vigorously with water
- **Group 7 — Halogens** (F, Cl, Br, I): 7 outer electrons, reactive non-metals, form -1 ions
- **Group 0 — Noble gases** (He, Ne, Ar): full outer shells, very unreactive (inert)

**Metals vs Non-metals:**
- Metals are on the left and centre of the periodic table
- Non-metals are on the right (except hydrogen)
- The dividing line is a "staircase" from boron to astatine

**Trends in the periodic table:**
- Going down a group: atomic radius increases, reactivity of metals increases, reactivity of non-metals decreases
- Going across a period: atomic radius decreases, elements change from metals to non-metals

**Why is the Periodic Table so useful?** If you know the group of an element, you can predict its properties — even for elements you have never studied.`,
        narrationScriptEn: "The Periodic Table organises elements by atomic number. Elements in the same group have the same number of outer electrons and similar properties. Group 1 metals are very reactive. Group 7 halogens are reactive non-metals. Group 0 noble gases are almost completely unreactive."
      },
      {
        order: 3, titleEn: "Chemical Bonding",
        summaryEn: "Atoms bond by ionic, covalent, or metallic bonding to achieve stable electron configurations.",
        bodyEn: `Atoms form **chemical bonds** to achieve a stable electron configuration — usually a full outer shell of 8 electrons (or 2 for the first shell).

**Ionic bonding:**
- Occurs between metals and non-metals
- Metal atoms **lose** electrons → form positive ions (cations)
- Non-metal atoms **gain** electrons → form negative ions (anions)
- Oppositely charged ions attract each other (electrostatic attraction)
- Example: Sodium chloride (NaCl) — Na loses 1 electron (Na⁺), Cl gains 1 electron (Cl⁻)
- Properties: high melting point, conducts electricity when molten or dissolved, forms crystals

**Covalent bonding:**
- Occurs between non-metals
- Atoms **share** pairs of electrons
- Each shared pair is one covalent bond
- Example: Water (H₂O) — each H shares 1 electron with O; O shares 1 electron with each H
- Example: Oxygen (O₂) — double bond (two shared pairs)
- Properties of simple covalent molecules: low melting point, do not conduct electricity

**Metallic bonding:**
- Occurs in metals
- Metal atoms form a lattice of positive ions
- Outer electrons are delocalised (free to move through the lattice)
- The attraction between positive ions and delocalised electrons holds the metal together
- Properties: good conductors of electricity and heat, malleable, ductile, high melting points

**Dot-and-cross diagrams** show the arrangement of outer electrons in bonded atoms — you need to be able to draw these for common molecules.`,
        narrationScriptEn: "Atoms form bonds to achieve a full outer electron shell. Ionic bonding involves electron transfer between metals and non-metals. Covalent bonding involves electron sharing between non-metals. Metallic bonding involves a lattice of positive ions surrounded by delocalised electrons."
      },
      {
        order: 4, titleEn: "Chemical Reactions and Equations",
        summaryEn: "Chemical equations show reactants and products. Equations must be balanced.",
        bodyEn: `A **chemical reaction** involves the breaking and making of chemical bonds, converting reactants into products. The total mass is conserved (law of conservation of mass).

**Word equations:** describe a reaction in words
- Magnesium + oxygen → magnesium oxide
- Hydrochloric acid + sodium hydroxide → sodium chloride + water

**Symbol equations:** use chemical formulae
- 2Mg + O₂ → 2MgO
- HCl + NaOH → NaCl + H₂O

**Balancing equations:**
- The number of each type of atom must be the same on both sides
- You can only change the **coefficients** (numbers in front of formulae) — never change the formulae themselves
- Method: balance one element at a time, usually leaving hydrogen and oxygen until last

**Example:** H₂ + O₂ → H₂O
- Left: 2H, 2O | Right: 2H, 1O → not balanced
- Add coefficient: 2H₂ + O₂ → 2H₂O
- Left: 4H, 2O | Right: 4H, 2O ✓

**State symbols:**
- (s) = solid, (l) = liquid, (g) = gas, (aq) = aqueous (dissolved in water)

**Types of chemical reactions:**
- **Combustion:** fuel + oxygen → carbon dioxide + water (+ energy)
- **Neutralisation:** acid + base → salt + water
- **Decomposition:** one compound breaks down into simpler substances
- **Displacement:** a more reactive element displaces a less reactive one from a compound
- **Precipitation:** two solutions react to form an insoluble solid (precipitate)`,
        narrationScriptEn: "Chemical equations show reactants on the left and products on the right. Equations must be balanced — the same number of each atom on both sides. You can only change the coefficients, never the formulae. State symbols show whether substances are solid, liquid, gas, or aqueous."
      }
    ]
  },

  // Topic 10: Physics — Forces
  {
    topicId: 10, titleEn: "Forces and Motion", titleAr: "القوى والحركة", order: 1, estimatedMinutes: 25,
    sections: [
      {
        order: 1, titleEn: "Types of Forces",
        summaryEn: "Forces are pushes or pulls. They can be contact forces or non-contact forces.",
        bodyEn: `A **force** is a push or pull that acts on an object. Forces can change an object's speed, direction, or shape.

**Contact forces** require physical contact:
- **Friction:** opposes motion between surfaces in contact; converts kinetic energy to heat
- **Normal reaction (normal force):** perpendicular to a surface; prevents objects from passing through surfaces
- **Tension:** force in a stretched rope, string, or spring
- **Air resistance (drag):** friction between an object and the air; opposes motion
- **Upthrust (buoyancy):** upward force on an object submerged in a fluid

**Non-contact forces** act at a distance:
- **Gravity (gravitational force):** attractive force between masses; always attractive, never repulsive
- **Magnetic force:** attraction or repulsion between magnets or between a magnet and a magnetic material
- **Electrostatic force:** attraction or repulsion between charged objects

**Measuring forces:** Forces are measured in **Newtons (N)** using a force meter (newton meter or spring balance).

**Resultant force:** When multiple forces act on an object, the resultant is the single force that has the same effect as all the forces combined.
- Forces in the same direction: add them
- Forces in opposite directions: subtract them
- If resultant force = 0 → object is in **equilibrium** (stationary or moving at constant velocity)

**Free body diagrams** show all forces acting on an object as arrows. The length of the arrow represents the magnitude; the direction shows the direction of the force.`,
        narrationScriptEn: "Forces are pushes or pulls measured in Newtons. Contact forces require physical contact — like friction and tension. Non-contact forces act at a distance — like gravity and magnetism. The resultant force is the single force equivalent to all forces combined. If the resultant is zero, the object is in equilibrium."
      },
      {
        order: 2, titleEn: "Newton's Laws of Motion",
        summaryEn: "Newton's three laws describe how forces affect the motion of objects.",
        bodyEn: `Sir Isaac Newton's three laws of motion form the foundation of classical mechanics.

**Newton's First Law (Law of Inertia):**
An object remains at rest, or continues moving in a straight line at constant speed, unless acted upon by a resultant force.
- A stationary ball stays still unless kicked
- A moving ball keeps moving unless friction or another force slows it
- **Inertia** is the tendency of an object to resist changes to its motion; greater mass = greater inertia

**Newton's Second Law:**
The resultant force on an object equals its mass multiplied by its acceleration.
**F = ma**
- F = resultant force (N)
- m = mass (kg)
- a = acceleration (m/s²)
- Rearrangements: a = F/m and m = F/a

**Example:** A 5 kg object accelerates at 3 m/s². Resultant force = 5 × 3 = **15 N**

**Newton's Third Law:**
For every action, there is an equal and opposite reaction.
- When you push a wall, the wall pushes back on you with equal force
- A rocket expels gas downward (action) → gas pushes rocket upward (reaction)
- Note: the action and reaction forces act on DIFFERENT objects

**Weight vs Mass:**
- **Mass** is the amount of matter in an object (kg) — constant everywhere
- **Weight** is the gravitational force on an object (N) — varies with gravitational field strength
- W = mg (weight = mass × gravitational field strength)
- On Earth, g ≈ 10 N/kg; on the Moon, g ≈ 1.6 N/kg`,
        narrationScriptEn: "Newton's First Law: an object stays still or moves at constant speed unless a resultant force acts on it. Newton's Second Law: force equals mass times acceleration. Newton's Third Law: every action has an equal and opposite reaction acting on a different object."
      },
      {
        order: 3, titleEn: "Speed, Velocity and Acceleration",
        summaryEn: "Speed is distance per time. Velocity includes direction. Acceleration is change in velocity per time.",
        bodyEn: `**Speed** is a measure of how fast an object is moving. It is a scalar quantity — it has magnitude but no direction.
- **Speed = Distance ÷ Time** (v = d/t)
- Units: m/s or km/h

**Velocity** is speed in a specified direction. It is a vector quantity — it has both magnitude and direction.
- A car travelling at 30 m/s north has a different velocity to one travelling at 30 m/s south, even though their speeds are the same.

**Acceleration** is the rate of change of velocity.
- **a = (v - u) / t**
- a = acceleration (m/s²)
- v = final velocity (m/s)
- u = initial velocity (m/s)
- t = time (s)
- Deceleration is negative acceleration (velocity decreasing)

**Distance-time graphs:**
- Horizontal line → stationary (not moving)
- Straight diagonal line → constant speed
- Curved line → changing speed (acceleration or deceleration)
- Gradient = speed

**Velocity-time graphs:**
- Horizontal line → constant velocity (zero acceleration)
- Straight diagonal line → constant acceleration
- Gradient = acceleration
- Area under graph = distance travelled

**SUVAT equations** (for constant acceleration):
- v = u + at
- s = ut + ½at²
- v² = u² + 2as
- s = ½(u + v)t
where s = displacement, u = initial velocity, v = final velocity, a = acceleration, t = time`,
        narrationScriptEn: "Speed equals distance divided by time. Velocity is speed with a direction. Acceleration is the change in velocity divided by time. On a distance-time graph, the gradient gives speed. On a velocity-time graph, the gradient gives acceleration and the area under the graph gives distance."
      },
      {
        order: 4, titleEn: "Pressure and Moments",
        summaryEn: "Pressure is force per unit area. A moment is the turning effect of a force.",
        bodyEn: `**Pressure** is the force acting per unit area. The same force spread over a larger area produces less pressure.
- **P = F / A**
- P = pressure (Pa or N/m²)
- F = force (N)
- A = area (m²)

**Examples:**
- A sharp knife cuts because the force is concentrated on a tiny area → high pressure
- Snowshoes spread your weight over a large area → low pressure (you don't sink)
- A drawing pin has a sharp point (small area) → high pressure to penetrate a surface

**Pressure in fluids:**
- Pressure in a liquid increases with depth: P = ρgh (density × g × height)
- Pressure acts equally in all directions at the same depth

**Moments (Torques):**
A **moment** is the turning effect of a force about a pivot.
- **Moment = Force × Perpendicular distance from pivot**
- M = F × d
- Units: Newton-metres (Nm)

**Principle of moments (law of levers):**
For an object in equilibrium: **sum of clockwise moments = sum of anticlockwise moments**

**Example:** A 3 N force 4 m from a pivot creates a moment of 3 × 4 = 12 Nm. To balance it, a 6 N force must be placed 12 ÷ 6 = 2 m from the pivot on the other side.

**Applications:** seesaws, levers, spanners, wheelbarrows — all use moments to multiply force or increase turning effect.`,
        narrationScriptEn: "Pressure equals force divided by area. A sharp knife has high pressure because the force is concentrated on a tiny area. A moment is the turning effect of a force — force multiplied by the perpendicular distance from the pivot. For equilibrium, clockwise moments must equal anticlockwise moments."
      }
    ]
  }
];

console.log(`Seeding ${lessons.length} lessons...`);

for (const lesson of lessons) {
  // Insert lesson
  const [result] = await conn.query(
    `INSERT INTO lessons (topicId, titleEn, titleAr, \`order\`, estimatedMinutes, isActive) VALUES (?, ?, ?, ?, ?, 1)`,
    [lesson.topicId, lesson.titleEn, lesson.titleAr ?? lesson.titleEn, lesson.order, lesson.estimatedMinutes]
  );
  const lessonId = result.insertId;
  console.log(`  ✓ Lesson ${lessonId}: ${lesson.titleEn}`);

  for (const section of lesson.sections) {
    await conn.query(
      `INSERT INTO sections (lessonId, \`order\`, titleEn, titleAr, summaryEn, summaryAr, bodyEn, bodyAr, narrationScriptEn, readingLevel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        lessonId,
        section.order,
        section.titleEn,
        section.titleAr ?? section.titleEn,
        section.summaryEn,
        section.summaryAr ?? section.summaryEn,
        section.bodyEn,
        section.bodyAr ?? section.bodyEn,
        section.narrationScriptEn ?? section.summaryEn,
        2
      ]
    );
    console.log(`    ✓ Section: ${section.titleEn}`);
  }
}

console.log('\n✅ All lessons seeded successfully!');
await conn.end();
