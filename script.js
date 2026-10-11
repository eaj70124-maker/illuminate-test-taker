const TEST_LENGTH = 8;

const state = {
  questions: [],
  answers: {},
};

const inputEl = document.getElementById('testCode');
const generateBtn = document.getElementById('generateBtn');
const submitBtn = document.getElementById('submitBtn');
const testPanel = document.getElementById('testPanel');
const resultsPanel = document.getElementById('resultsPanel');
const questionsContainer = document.getElementById('questionsContainer');
const testTitle = document.getElementById('testTitle');
const codeChip = document.getElementById('codeChip');
const scoreValue = document.getElementById('scoreValue');
const resultSummary = document.getElementById('resultSummary');

function normalizeCode(raw) {
  return String(raw || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 8)
    .toUpperCase()
    .padEnd(8, '0');
}

function hashString(str) {
  let hash = 2166136261;

  for (let i = 0; i < str.length; i += 1) {
    const char = str.charCodeAt(i);
    hash ^= char;
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rand, min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function createQuestionSet(code) {
  const seed = hashString(code);
  const rand = mulberry32(seed);
  const questions = [];

  const templates = [
    () => {
      const a = randInt(rand, 8, 24);
      const b = randInt(rand, 3, 12);
      const op = ['+', '-', '×'][randInt(rand, 0, 2)];
      let prompt = '';
      let correct = 0;

      if (op === '+') {
        correct = a + b;
        prompt = `${a} + ${b} = ?`;
      } else if (op === '-') {
        correct = a - b;
        prompt = `${a} - ${b} = ?`;
      } else {
        correct = a * b;
        prompt = `${a} × ${b} = ?`;
      }

      const values = new Set([correct]);
      while (values.size < 4) {
        values.add(correct + randInt(rand, -9, 9));
      }

      return {
        prompt,
        options: shuffle([...values], rand).map(String),
        answer: String(correct),
      };
    },
    () => {
      const x = randInt(rand, 2, 10);
      const m = randInt(rand, 2, 9);
      const b = randInt(rand, 1, 12);
      const answer = (x * m) + b;
      const prompt = `If y = ${m}x + ${b}, what is y when x = ${x}?`;
      const wrongs = [answer + 3, answer - 2, answer + 7, answer - 5].map(String);

      return {
        prompt,
        options: shuffle([String(answer), ...wrongs], rand),
        answer: String(answer),
      };
    },
    () => {
      const base = randInt(rand, 5, 25);
      const rate = randInt(rand, 10, 45);
      const answer = Math.round((base * rate) / 100);
      const prompt = `What is ${rate}% of ${base}?`;
      const wrongs = [answer + 4, answer - 3, answer + 9, answer - 7].map(String);
      return {
        prompt,
        options: shuffle([String(answer), ...wrongs], rand),
        answer: String(answer),
      };
    },
    () => {
      const start = randInt(rand, 2, 8);
      const step = randInt(rand, 2, 6);
      const sequence = Array.from({ length: 4 }, (_, i) => start + i * step);
      const missing = sequence[2] + step;
      const prompt = `Find the next number: ${sequence.join(', ')}, ?`;
      const wrongs = [missing + 2, missing - 3, missing + 5, missing - 1].map(String);
      return {
        prompt,
        options: shuffle([String(missing), ...wrongs], rand),
        answer: String(missing),
      };
    },
    () => {
      const wordBank = ['resilient', 'vivid', 'cautious', 'frugal', 'brisk', 'subtle', 'meticulous', 'luminous'];
      const word = wordBank[randInt(rand, 0, wordBank.length - 1)];
      const definitions = {
        resilient: 'able to recover quickly from difficulty',
        vivid: 'producing strong, clear images in the mind',
        cautious: 'careful to avoid potential problems',
        frugal: 'economical in the use of resources',
        brisk: 'quick and energetic',
        subtle: 'so delicate or precise as to be difficult to analyze or describe',
        meticulous: 'showing great attention to detail',
        luminous: 'giving off light; bright',
      };
      const prompt = `Which word best matches this definition: "${definitions[word]}"?`;
      const options = [word];
      while (options.length < 4) {
        const candidate = wordBank[randInt(rand, 0, wordBank.length - 1)];
        if (!options.includes(candidate)) options.push(candidate);
      }
      return {
        prompt,
        options: shuffle(options, rand),
        answer: word,
      };
    },
    () => {
      const questionBank = [
        { q: 'Which planet is known as the Red Planet?', a: 'Mars', options: ['Venus', 'Mars', 'Jupiter', 'Mercury'] },
        { q: 'Which organ pumps blood throughout the body?', a: 'Heart', options: ['Lungs', 'Heart', 'Liver', 'Brain'] },
        { q: 'What force keeps objects on the ground?', a: 'Gravity', options: ['Magnetism', 'Gravity', 'Friction', 'Momentum'] },
        { q: 'Which gas do plants absorb from the atmosphere?', a: 'Carbon dioxide', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Helium'] },
      ];
      const item = questionBank[randInt(rand, 0, questionBank.length - 1)];
      return {
        prompt: item.q,
        options: shuffle(item.options, rand),
        answer: item.a,
      };
    },
    () => {
      const a = randInt(rand, 1, 9);
      const b = randInt(rand, 2, 12);
      const perimeter = 2 * (a + b);
      const prompt = `A rectangle has sides of length ${a} and ${b}. What is its perimeter?`;
      const wrongs = [perimeter + 4, perimeter - 2, perimeter + 10, perimeter - 6].map(String);
      return {
        prompt,
        options: shuffle([String(perimeter), ...wrongs], rand),
        answer: String(perimeter),
      };
    },
    () => {
      const items = [
        { q: 'All squares are rectangles. True or false?', a: 'True', options: ['True', 'False', 'Only if they are blue', 'None of the above'] },
        { q: 'A triangle has 3 sides. True or false?', a: 'True', options: ['True', 'False', 'Only if acute', 'No'] },
        { q: 'If today is Monday, what day comes next?', a: 'Tuesday', options: ['Wednesday', 'Friday', 'Tuesday', 'Sunday'] },
      ];
      const item = items[randInt(rand, 0, items.length - 1)];
      return {
        prompt: item.q,
        options: shuffle(item.options, rand),
        answer: item.a,
      };
    },
  ];

  for (let i = 0; i < TEST_LENGTH; i += 1) {
    const template = templates[i % templates.length];
    questions.push(template());
  }

  return questions;
}

function shuffle(array, rand) {
  const list = [...array];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function renderQuestions() {
  questionsContainer.innerHTML = '';

  state.questions.forEach((question, index) => {
    const card = document.createElement('article');
    card.className = 'question-card';

    const heading = document.createElement('h4');
    heading.textContent = `${index + 1}. ${question.prompt}`;
    card.appendChild(heading);

    const list = document.createElement('div');
    list.className = 'option-list';

    question.options.forEach((option) => {
      const row = document.createElement('label');
      row.className = 'option-item';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `q-${index}`;
      input.value = option;
      input.checked = state.answers[index] === option;
      input.addEventListener('change', () => {
        state.answers[index] = option;
      });

      const text = document.createElement('span');
      text.textContent = option;

      row.appendChild(input);
      row.appendChild(text);
      list.appendChild(row);
    });

    card.appendChild(list);
    questionsContainer.appendChild(card);
  });
}

function generateTest() {
  const raw = inputEl.value.trim();
  const code = normalizeCode(raw);

  if (!code || code === '00000000') {
    inputEl.focus();
    inputEl.setAttribute('placeholder', 'Enter an 8-digit code');
    return;
  }

  state.questions = createQuestionSet(code);
  state.answers = {};
  resultsPanel.classList.add('hidden');
  testPanel.classList.remove('hidden');

  const formattedCode = code.replace(/(.{4})/g, '$1 ').trim();
  codeChip.textContent = `Code: ${formattedCode}`;
  testTitle.textContent = `Assessment for ${formattedCode}`;

  renderQuestions();
  inputEl.blur();
}

function scoreTest() {
  const total = state.questions.length;
  let correct = 0;

  state.questions.forEach((question, index) => {
    if (state.answers[index] === question.answer) {
      correct += 1;
    }
  });

  const percent = Math.round((correct / total) * 100);
  scoreValue.textContent = `${percent}%`;

  const summary = [
    `<strong>${correct}/${total}</strong> correct answers`,
    percent >= 80 ? 'Strong performance. You passed this code-generated assessment.' : percent >= 50 ? 'Good work. A little more study would push this higher.' : 'Keep going — this code generated a tougher set than expected.',
  ];

  resultSummary.innerHTML = summary.map((item) => `<div class="result-item">${item}</div>`).join('');
}

function submitTest() {
  if (!state.questions.length) {
    return;
  }

  scoreTest();
  testPanel.classList.add('hidden');
  resultsPanel.classList.remove('hidden');
}

generateBtn.addEventListener('click', generateTest);
submitBtn.addEventListener('click', submitTest);
inputEl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    generateTest();
  }
});

inputEl.value = '48291347';
generateTest();

window.addEventListener('load', () => {
  inputEl.focus();
});

