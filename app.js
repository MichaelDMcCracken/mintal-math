/**
 * Mintal Math - Interactive Flashcard & Adaptive Learning Application
 * Features:
 * - 4 Core Arithmetic Operations (+, -, *, /)
 * - 4 Specialist Problem Modes (% Tips, x² Powers & Roots, ? Algebra, ⋯ Chain Math)
 * - Leitner 5-Box Spaced Repetition System
 * - Daily Mint (Wordle-style 15-question daily challenge with calendar streak)
 * - Gamified Mint Leaves XP & Level progression
 * - Ghost Race (compete against your personal record in 60s Sprint)
 * - Adaptive Weak-Spot Weighting & 12x12 Multiplication Heatmap
 * - PWA Offline Caching & Web Audio sound effects
 */

(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEY = 'mintal_math_user_data_v2';
  const SETTINGS_KEY = 'mintal_math_settings_v2';

  // --- Sound Engine (Web Audio API) ---
  class SoundManager {
    constructor() {
      this.enabled = true;
      this.ctx = null;
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
    }

    playCorrect() {
      if (!this.enabled) return;
      try {
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, now); // E5
        osc1.frequency.exponentialRampToValueAtTime(987.77, now + 0.12); // B5

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1318.51, now + 0.05); // E6

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.05);
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.35);
      } catch (e) {}
    }

    playWrong() {
      if (!this.enabled) return;
      try {
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
      } catch (e) {}
    }
  }

  // --- Seeded Random Number Generator for Daily Mint ---
  function createSeededRNG(seedStr) {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
      hash |= 0;
    }
    let s = Math.abs(hash) || 123456789;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  // --- Mental Math Strategies / Tips Engine ---
  function generateMentalMathTip(problem) {
    const { op, num1, num2, answer, type } = problem;

    if (type === 'percent') {
      return problem.customTip || `Find 10% first by moving the decimal, then scale as needed!`;
    }

    if (type === 'pow') {
      return problem.customTip || `Memorizing common squares and roots builds fast pattern recognition.`;
    }

    if (type === 'algebra') {
      return problem.customTip || `Use the inverse operation to isolate the unknown!`;
    }

    if (type === 'chain') {
      return problem.customTip || `Break calculations down into order of operations: parentheses first!`;
    }

    if (op === '*') {
      if (num1 === 0 || num2 === 0) return `Multiplication by 0: Any number multiplied by 0 always equals 0!`;
      if (num1 === 1 || num2 === 1) return `Multiplicative identity: Multiplying by 1 is always the number itself!`;
      if (num2 === 9 || num1 === 9) {
        const other = num2 === 9 ? num1 : num2;
        return `Multiply by 10 and subtract itself: (${other} × 10) − ${other} = ${other * 10} − ${other} = ${answer}!`;
      }
      if (num2 === 5 || num1 === 5) {
        const other = num2 === 5 ? num1 : num2;
        return `Multiply by 10, then divide by 2: (${other} × 10) ÷ 2 = ${other * 10} ÷ 2 = ${answer}!`;
      }
      if (num2 === 4 || num1 === 4) {
        const other = num2 === 4 ? num1 : num2;
        return `Double it twice: (${other} × 2) = ${other * 2}, and (${other * 2} × 2) = ${answer}!`;
      }
      if (num2 === 8 || num1 === 8) {
        const other = num2 === 8 ? num1 : num2;
        return `Double it three times (×2, ×2, ×2): ${other * 2} → ${other * 4} → ${answer}!`;
      }
      if (num2 === 11 || num1 === 11) {
        const other = num2 === 11 ? num1 : num2;
        return `Multiply by 10 and add the number: (${other} × 10) + ${other} = ${other * 10} + ${other} = ${answer}!`;
      }
      if (num1 >= 12 && num2 >= 3 && num2 <= 9) {
        const tens = Math.floor(num1 / 10) * 10;
        const ones = num1 % 10;
        if (ones > 0) {
          return `Decompose into tens and ones: (${tens} × ${num2}) + (${ones} × ${num2}) = ${tens * num2} + ${ones * num2} = ${answer}!`;
        }
      }
      if (num1 === num2) return `Square of ${num1}: Remember your perfect squares: ${num1}² = ${answer}!`;
      return `Break down the problem: ${num1} × ${num2} = ${answer}. Commutative property: ${num2} × ${num1} gives the same result.`;
    }

    if (op === '+') {
      if (num1 === 0 || num2 === 0) return `Identity property: Adding 0 leaves the number unchanged (${answer})!`;
      if (num2 % 10 >= 7) {
        const rounded = Math.ceil(num2 / 10) * 10;
        const diff = rounded - num2;
        return `Round up to ${rounded}: (${num1} + ${rounded}) − ${diff} = ${num1 + rounded} − ${diff} = ${answer}!`;
      }
      if (num1 >= 10 && num2 >= 10) {
        const tens1 = Math.floor(num1 / 10) * 10;
        const tens2 = Math.floor(num2 / 10) * 10;
        const ones = (num1 % 10) + (num2 % 10);
        return `Add tens first, then units: (${tens1} + ${tens2}) + (${ones}) = ${tens1 + tens2 + ones}!`;
      }
      return `Group numbers to make a clean 10 or 100 for faster addition.`;
    }

    if (op === '-') {
      if (num2 === 0) return `Subtracting 0 leaves ${num1} unchanged (${answer})!`;
      if (num1 === num2) return `Any number minus itself always equals 0!`;
      if (num2 % 10 >= 7) {
        const rounded = Math.ceil(num2 / 10) * 10;
        const diff = rounded - num2;
        return `Subtract ${rounded} first, then add back ${diff}: (${num1} − ${rounded}) + ${diff} = ${answer}!`;
      }
      return `Count up from ${num2} to ${num1} or subtract the tens first, then the ones.`;
    }

    if (op === '/') {
      if (num1 === 0) return `Dividing zero: 0 divided by any non-zero number is always 0!`;
      if (num2 === 1) return `Dividing by 1: Any number divided by 1 is itself (${answer})!`;
      if (num1 === num2) return `Any non-zero number divided by itself always equals 1!`;
      if (num2 === 5) return `Divide by 5 shortcut: Double the number and divide by 10! (${num1} × 2) ÷ 10 = ${answer}!`;
      if (num2 === 4) return `Divide by 4: Halve it twice: (${num1} ÷ 2) = ${num1 / 2}, then half again = ${answer}!`;
      return `Think backwards: What number times ${num2} equals ${num1}? Answer is ${answer}.`;
    }

    return `Keep practicing this pattern to build instant recall!`;
  }

  // --- App State ---
  const state = {
    mode: 'practice', // 'practice', 'daily', 'speedrun', 'test20'
    selectedOps: ['+', '-', '*', '/'],
    difficulty: 'medium', // 'easy', 'medium', 'hard', 'custom'
    customMin: 0,
    customMax: 25,
    adaptiveEnabled: true,
    targetDrillWeakSpot: false,
    activeLeitnerFilter: null, // filter by box 1..5

    currentProblem: null,
    cardFlipped: false,
    problemStartTime: null,
    timerInterval: null,
    isPaused: false,
    pausedElapsedMs: 0,

    session: {
      streak: 0,
      bestStreak: 0,
      totalAttempted: 0,
      totalCorrect: 0,
      latencies: []
    },

    daily: {
      active: false,
      questions: [],
      currentIndex: 0,
      correct: 0,
      dateStr: ''
    },

    speedrun: {
      timer: null,
      timeLeft: 60,
      active: false,
      score: 0,
      ghostTargetScore: 15
    },

    test20: {
      active: false,
      currentIndex: 0,
      total: 20,
      correct: 0
    }
  };

  const sound = new SoundManager();

  // --- Local Storage Management ---
  function getTodayString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function loadUserData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    return {
      overall: {
        totalAttempted: 0,
        totalCorrect: 0,
        bestStreak: 0,
        sumLatencyMs: 0
      },
      gamification: {
        leaves: 0,
        dailyStreak: 0,
        lastDailyDate: '',
        bestSpeedrunScore: 12
      },
      problems: {} // "key" -> { attempts, correct, wrong, lastLatencyMs, box (1-5), lastSeen }
    };
  }

  function saveUserData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      theme: 'light',
      sound: true,
      adaptive: true,
      ops: ['+', '-', '*', '/'],
      difficulty: 'medium'
    };
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {}
  }

  // --- XP & Level Calculations ---
  function getRankDetails(leaves) {
    if (leaves < 150) return { rank: 'Seedling', icon: '🌿', min: 0, max: 150 };
    if (leaves < 450) return { rank: 'Scholar', icon: '🍃', min: 150, max: 450 };
    if (leaves < 1000) return { rank: 'Prodigy', icon: '☘️', min: 450, max: 1000 };
    if (leaves < 2500) return { rank: 'Master', icon: '🍵', min: 1000, max: 2500 };
    return { rank: 'Monarch', icon: '👑', min: 2500, max: 5000 };
  }

  function awardLeaves(amount, reason) {
    const data = loadUserData();
    data.gamification.leaves = (data.gamification.leaves || 0) + amount;
    saveUserData(data);
    updateXPDisplay();
    if (amount >= 15) {
      showToast(`+${amount} 🌿 Mint Leaves! (${reason})`);
    }
  }

  function updateXPDisplay() {
    const data = loadUserData();
    const leaves = data.gamification.leaves || 0;
    const rankInfo = getRankDetails(leaves);

    const leavesCountEl = document.getElementById('leaves-count');
    const rankNameEl = document.getElementById('rank-name');
    if (leavesCountEl) leavesCountEl.textContent = leaves;
    if (rankNameEl) rankNameEl.textContent = rankInfo.rank;

    // Daily Habit display in modal
    const dailyStatusEl = document.getElementById('daily-mint-status');
    const setupDailyStatusEl = document.getElementById('setup-daily-status');
    const startDailyBtnEl = document.getElementById('start-daily-btn');
    const dailyStreakEl = document.getElementById('daily-streak-display');
    const today = getTodayString();

    const isDoneToday = data.gamification.lastDailyDate === today;
    if (dailyStatusEl) {
      if (isDoneToday) {
        dailyStatusEl.textContent = '✅ Completed today! Come back tomorrow to keep your streak.';
        dailyStatusEl.style.color = 'var(--mint-600)';
      } else {
        dailyStatusEl.textContent = 'Not completed today yet! Tap "Daily Mint" to practice.';
        dailyStatusEl.style.color = 'var(--text-muted)';
      }
    }
    if (setupDailyStatusEl) {
      if (isDoneToday) {
        setupDailyStatusEl.innerHTML = `✅ <strong>Completed today!</strong> Streak: ${data.gamification.dailyStreak || 1} Days`;
        if (startDailyBtnEl) startDailyBtnEl.textContent = 'Practice Again';
      } else {
        setupDailyStatusEl.textContent = '15 fresh daily questions • Earn +50 🌿 Mint Leaves';
        if (startDailyBtnEl) startDailyBtnEl.textContent = "Play Today's Mint";
      }
    }
    if (dailyStreakEl) {
      dailyStreakEl.textContent = `🔥 ${data.gamification.dailyStreak || 0} Day Streak`;
    }
  }

  // --- DOM Elements ---
  const elements = {
    // Screen Views
    setupView: document.getElementById('setup-view'),
    practiceView: document.getElementById('practice-view'),
    startSessionBtn: document.getElementById('start-session-btn'),
    startDailyBtn: document.getElementById('start-daily-btn'),
    setupWeakspotsBtn: document.getElementById('setup-weakspots-btn'),
    setupMasteryBtn: document.getElementById('setup-mastery-btn'),
    exitPracticeBtn: document.getElementById('exit-practice-btn'),
    practiceStreak: document.getElementById('practice-streak'),
    practiceModeTag: document.getElementById('practice-mode-tag'),
    practicePauseBtn: document.getElementById('practice-pause-btn'),
    practicePauseIcon: document.getElementById('practice-pause-icon'),

    // Header
    pauseBtn: document.getElementById('pause-btn'),
    pauseIcon: document.getElementById('pause-icon'),
    soundBtn: document.getElementById('sound-btn'),
    soundIcon: document.getElementById('sound-icon'),
    themeBtn: document.getElementById('theme-btn'),
    themeIcon: document.getElementById('theme-icon'),
    analyticsBtn: document.getElementById('analytics-btn'),
    installBtn: document.getElementById('install-btn'),
    leavesBadge: document.getElementById('leaves-badge'),

    // Toggles & Inputs
    adaptiveToggle: document.getElementById('adaptive-toggle'),
    answerInput: document.getElementById('answer-input'),
    answerForm: document.getElementById('answer-form'),
    customRangeBox: document.getElementById('custom-range-box'),
    customMinSlider: document.getElementById('custom-min'),
    customMaxSlider: document.getElementById('custom-max'),
    customMinVal: document.getElementById('custom-min-val'),
    customMaxVal: document.getElementById('custom-max-val'),
    numpadToggle: document.getElementById('numpad-toggle'),
    submitBtn: document.getElementById('submit-btn'),
    flipBtn: document.getElementById('flip-btn'),
    skipBtn: document.getElementById('skip-btn'),
    numpad: document.getElementById('numpad'),
    toast: document.getElementById('toast'),

    // Status Bar
    statStreak: document.getElementById('stat-streak'),
    statAccuracy: document.getElementById('stat-accuracy'),
    statBestStreak: document.getElementById('stat-best-streak'),
    statAvgTime: document.getElementById('stat-avg-time'),

    // Flashcard Components
    flashcard: document.getElementById('flashcard'),
    cardBadge: document.getElementById('card-badge'),
    leitnerBadge: document.getElementById('leitner-badge'),
    problemText: document.getElementById('problem-text'),
    num1: document.getElementById('num1'),
    num2: document.getElementById('num2'),
    opSymbol: document.getElementById('op-symbol'),
    placeholderVal: document.getElementById('placeholder-val'),
    timerIndicator: document.getElementById('timer-indicator'),
    cardPauseBtn: document.getElementById('card-pause-btn'),
    pauseOverlay: document.getElementById('pause-overlay'),
    resumeBtn: document.getElementById('resume-btn'),
    cardFeedback: document.getElementById('card-feedback'),
    solutionAnswer: document.getElementById('solution-answer'),
    solutionTip: document.getElementById('solution-tip'),

    // Banners
    adaptiveBannerText: document.getElementById('adaptive-status-text'),
    viewWeakspotsBtn: document.getElementById('view-weakspots-btn'),
    speedrunBanner: document.getElementById('speedrun-banner'),
    speedrunVal: document.getElementById('speedrun-val'),
    speedrunTitle: document.getElementById('speedrun-title'),
    speedrunPauseBtn: document.getElementById('speedrun-pause-btn'),
    userRunnerScore: document.getElementById('user-runner-score'),
    ghostRunnerScore: document.getElementById('ghost-runner-score'),
    userFill: document.getElementById('user-fill'),
    ghostFill: document.getElementById('ghost-fill'),

    // Modal
    analyticsModal: document.getElementById('analytics-modal'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    closeModalBottomBtn: document.getElementById('close-modal-bottom-btn'),
    mTotalSolved: document.getElementById('m-total-solved'),
    mOverallAccuracy: document.getElementById('m-overall-accuracy'),
    mBestStreak: document.getElementById('m-best-streak'),
    leitnerShelf: document.getElementById('leitner-shelf'),
    weaknessList: document.getElementById('weakness-list'),
    strengthList: document.getElementById('strength-list'),
    heatmapGrid: document.getElementById('heatmap-grid'),
    drillWeakspotsBtn: document.getElementById('drill-weakspots-btn'),
    resetStatsBtn: document.getElementById('reset-stats-btn')
  };

  // --- Toast Utility ---
  let toastTimeout;
  function showToast(msg) {
    clearTimeout(toastTimeout);
    elements.toast.textContent = msg;
    elements.toast.classList.add('show');
    toastTimeout = setTimeout(() => {
      elements.toast.classList.remove('show');
    }, 2500);
  }

  // --- Difficulty & Range Utilities ---
  function getRangeForDifficulty(diff) {
    switch (diff) {
      case 'easy':
        return { min: 0, max: 10 };
      case 'medium':
        return { min: 0, max: 15 };
      case 'hard':
        return { min: 0, max: 25 };
      case 'custom':
        return {
          min: parseInt(state.customMin, 10) >= 0 ? parseInt(state.customMin, 10) : 0,
          max: parseInt(state.customMax, 10) || 25
        };
      default:
        return { min: 0, max: 15 };
    }
  }

  function randomInt(min, max, rng = Math.random) {
    return Math.floor(rng() * (max - min + 1)) + min;
  }

  function getProblemKey(op, num1, num2, type = 'basic') {
    if (type !== 'basic') return `${type}:${num1}_${num2}`;
    if (op === '+' || op === '*') {
      const [a, b] = num1 <= num2 ? [num1, num2] : [num2, num1];
      return `${op === '+' ? 'add' : 'mul'}:${a}${op === '+' ? '+' : 'x'}${b}`;
    }
    return `${op === '-' ? 'sub' : 'div'}:${num1}${op}${num2}`;
  }

  // --- Specialist Generators (#1 Problem Types) ---

  // 1. Percentages & Tips (%)
  function generatePercentProblem(rng = Math.random) {
    const percentages = [10, 15, 20, 25, 30, 50, 75];
    const pct = percentages[Math.floor(rng() * percentages.length)];
    // Pick base amount that gives clean whole number
    const multipliers = [20, 40, 60, 80, 100, 120, 140, 160, 200, 300, 400];
    const base = multipliers[Math.floor(rng() * multipliers.length)];
    const answer = Math.round((pct / 100) * base);

    const isTip = pct === 15 || pct === 20;
    const displayText = isTip
      ? `${pct}% tip on $${base} = ?`
      : `${pct}% of ${base} = ?`;

    let tip = `Find 10% first: ${base} ÷ 10 = ${base / 10}.`;
    if (pct === 20) tip += ` Then double it: ${(base / 10) * 2} = ${answer}!`;
    else if (pct === 15) tip += ` Then add half (${base / 20}): ${base / 10 + base / 20} = ${answer}!`;
    else if (pct === 25) tip = `25% is one-quarter: ${base} ÷ 4 = ${answer}!`;
    else if (pct === 50) tip = `50% is half: ${base} ÷ 2 = ${answer}!`;

    return {
      type: 'percent',
      num1: pct,
      num2: base,
      op: '%',
      displayText,
      answer,
      badge: isTip ? 'Real World • Tips' : 'Percentages',
      key: `pct:${pct}of${base}`,
      customTip: tip
    };
  }

  // 2. Squares & Roots (x²)
  function generatePowerProblem(rng = Math.random) {
    const isRoot = rng() > 0.6;
    if (isRoot) {
      const roots = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 25];
      const r = roots[Math.floor(rng() * roots.length)];
      const sq = r * r;
      return {
        type: 'pow',
        num1: sq,
        num2: 2,
        op: 'sqrt',
        displayText: `√${sq} = ?`,
        answer: r,
        badge: 'Roots',
        key: `sqrt:${sq}`,
        customTip: `Think: What number multiplied by itself equals ${sq}? Since ${r} × ${r} = ${sq}, the square root is ${r}!`
      };
    } else {
      const bases = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25];
      const b = bases[Math.floor(rng() * bases.length)];
      const ans = b * b;
      let tip = `Remember: ${b}² = ${b} × ${b} = ${ans}.`;
      if (b % 10 === 5) {
        const tens = Math.floor(b / 10);
        tip = `Trick for numbers ending in 5: (${tens} × ${tens + 1}) followed by 25 → ${tens * (tens + 1)}25 = ${ans}!`;
      }
      return {
        type: 'pow',
        num1: b,
        num2: 2,
        op: 'pow',
        displayText: `${b}² = ?`,
        answer: ans,
        badge: 'Powers & Squares',
        key: `sq:${b}`,
        customTip: tip
      };
    }
  }

  // 3. Missing Operand / Algebra (?)
  function generateAlgebraProblem(range, rng = Math.random) {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(rng() * ops.length)];
    let a, b, result, displayText, answer, tip;

    if (op === '+') {
      a = randomInt(range.min, range.max, rng);
      b = randomInt(range.min, range.max, rng);
      result = a + b;
      if (rng() > 0.5) {
        displayText = `${a} + ? = ${result}`;
        answer = b;
        tip = `Use inverse subtraction: ${result} − ${a} = ${b}!`;
      } else {
        displayText = `? + ${b} = ${result}`;
        answer = a;
        tip = `Use inverse subtraction: ${result} − ${b} = ${a}!`;
      }
    } else if (op === '-') {
      const x = randomInt(range.min, range.max, rng);
      const y = randomInt(range.min, range.max, rng);
      a = Math.max(x, y);
      b = Math.min(x, y);
      result = a - b;
      if (rng() > 0.5) {
        displayText = `${a} − ? = ${result}`;
        answer = b;
        tip = `Subtract result from total: ${a} − ${result} = ${b}!`;
      } else {
        displayText = `? − ${b} = ${result}`;
        answer = a;
        tip = `Add back: ${result} + ${b} = ${a}!`;
      }
    } else {
      // Multiplication
      a = randomInt(2, Math.min(range.max, 12), rng);
      b = randomInt(2, Math.min(range.max, 12), rng);
      result = a * b;
      displayText = `${a} × ? = ${result}`;
      answer = b;
      tip = `Use inverse division: ${result} ÷ ${a} = ${b}!`;
    }

    return {
      type: 'algebra',
      num1: a,
      num2: b,
      op,
      displayText,
      answer,
      badge: 'Algebra • Missing Operand',
      key: `alg:${op}:${a}_${b}`,
      customTip: tip
    };
  }

  // 4. Chain Arithmetic (⋯)
  function generateChainProblem(rng = Math.random) {
    const patterns = [
      // (a * b) - c
      () => {
        const a = randomInt(3, 9, rng);
        const b = randomInt(3, 9, rng);
        const c = randomInt(2, 15, rng);
        const ans = a * b - c;
        return {
          displayText: `(${a} × ${b}) − ${c} = ?`,
          answer: ans,
          customTip: `Parentheses first: ${a} × ${b} = ${a * b}. Then subtract ${c} = ${ans}!`
        };
      },
      // (a * b) + c
      () => {
        const a = randomInt(3, 9, rng);
        const b = randomInt(3, 9, rng);
        const c = randomInt(5, 25, rng);
        const ans = a * b + c;
        return {
          displayText: `(${a} × ${b}) + ${c} = ?`,
          answer: ans,
          customTip: `Parentheses first: ${a} × ${b} = ${a * b}. Then add ${c} = ${ans}!`
        };
      },
      // a + b + c
      () => {
        const a = randomInt(10, 30, rng);
        const b = randomInt(10, 30, rng);
        const c = randomInt(5, 20, rng);
        const ans = a + b + c;
        return {
          displayText: `${a} + ${b} + ${c} = ?`,
          answer: ans,
          customTip: `Add the first two first: ${a} + ${b} = ${a + b}. Then add ${c} = ${ans}!`
        };
      }
    ];

    const pick = patterns[Math.floor(rng() * patterns.length)]();
    return {
      type: 'chain',
      op: 'chain',
      displayText: pick.displayText,
      answer: pick.answer,
      badge: 'Chain Math',
      key: `chain:${pick.displayText}`,
      customTip: pick.customTip
    };
  }

  // --- Leitner & Adaptive Memory Retrieval ---
  function getProblemLeitnerBox(key) {
    const data = loadUserData();
    return (data.problems[key] && data.problems[key].box) || 1;
  }

  function getStrugglingProblems() {
    const userData = loadUserData();
    const struggling = [];

    for (const [key, record] of Object.entries(userData.problems)) {
      const attempts = record.attempts || 0;
      const wrong = record.wrong || 0;
      if (attempts >= 2) {
        const errorRate = wrong / attempts;
        if (errorRate >= 0.3 || (record.lastLatencyMs && record.lastLatencyMs > 4500)) {
          struggling.push({ key, errorRate, ...record });
        }
      } else if (attempts === 1 && wrong === 1) {
        struggling.push({ key, errorRate: 1.0, ...record });
      }
    }
    struggling.sort((a, b) => b.errorRate - a.errorRate);
    return struggling;
  }

  function recreateProblemFromKey(key, box) {
    const basicMatch = key.match(/^(add|sub|mul|div):(\d+)(?:\+|x|-|\/)(\d+)$/);
    if (basicMatch) {
      const [, prefix, first, second] = basicMatch;
      const num1 = Number(first);
      const num2 = Number(second);
      const operations = { add: '+', sub: '-', mul: '*', div: '/' };
      const op = operations[prefix];
      const opSymbol = { '+': '+', '-': '−', '*': '×', '/': '÷' }[op];
      const answer = op === '+' ? num1 + num2
        : op === '-' ? num1 - num2
          : op === '*' ? num1 * num2
            : num1 / num2;
      const problem = {
        type: 'basic',
        num1,
        num2,
        op,
        opSymbol,
        displayText: `${num1} ${opSymbol} ${num2} = ?`,
        answer,
        badge: 'Leitner Review',
        key,
        box
      };
      problem.tip = generateMentalMathTip(problem);
      return problem;
    }

    const percentMatch = key.match(/^pct:(\d+)of(\d+)$/);
    if (percentMatch) {
      const pct = Number(percentMatch[1]);
      const base = Number(percentMatch[2]);
      const problem = {
        type: 'percent',
        num1: pct,
        num2: base,
        op: '%',
        displayText: `${pct}% of ${base} = ?`,
        answer: (pct / 100) * base,
        badge: 'Leitner Review',
        key,
        box
      };
      problem.tip = generateMentalMathTip(problem);
      return problem;
    }

    const squareMatch = key.match(/^sq:(\d+)$/);
    if (squareMatch) {
      const base = Number(squareMatch[1]);
      const problem = {
        type: 'pow',
        num1: base,
        num2: 2,
        op: 'pow',
        displayText: `${base}² = ?`,
        answer: base * base,
        badge: 'Leitner Review',
        key,
        box
      };
      problem.tip = generateMentalMathTip(problem);
      return problem;
    }

    const rootMatch = key.match(/^sqrt:(\d+)$/);
    if (rootMatch) {
      const square = Number(rootMatch[1]);
      const answer = Math.sqrt(square);
      const problem = {
        type: 'pow',
        num1: square,
        num2: 2,
        op: 'sqrt',
        displayText: `√${square} = ?`,
        answer,
        badge: 'Leitner Review',
        key,
        box
      };
      problem.tip = generateMentalMathTip(problem);
      return problem;
    }

    return null;
  }

  // --- Main Problem Generator ---
  function generateProblem() {
    // If in Daily Mint mode, serve deterministic daily question
    if (state.mode === 'daily' && state.daily.active) {
      if (state.daily.currentIndex < state.daily.questions.length) {
        const q = state.daily.questions[state.daily.currentIndex];
        elements.adaptiveBannerText.innerHTML = `📅 <strong>Daily Mint:</strong> Question ${state.daily.currentIndex + 1} of ${state.daily.questions.length}`;
        return q;
      }
    }

    const userData = loadUserData();

    // Check if filtering by Leitner Box
    if (state.activeLeitnerFilter) {
      const boxKeys = Object.keys(userData.problems).filter(
        (k) => (userData.problems[k].box || 1) === state.activeLeitnerFilter
          && recreateProblemFromKey(k, state.activeLeitnerFilter)
      );
      if (boxKeys.length > 0) {
        const chosenKey = boxKeys[Math.floor(Math.random() * boxKeys.length)];
        elements.adaptiveBannerText.innerHTML = `📦 <strong>Reviewing Box ${state.activeLeitnerFilter}:</strong> Target practice`;
        return recreateProblemFromKey(
          chosenKey,
          state.activeLeitnerFilter
        );
      }
    }

    // Adaptive weak spot targeting
    const weakSpots = getStrugglingProblems();
    const shouldTargetWeakSpot =
      state.adaptiveEnabled &&
      weakSpots.length > 0 &&
      (state.targetDrillWeakSpot || Math.random() < 0.4);

    if (shouldTargetWeakSpot) {
      const pickIdx = Math.floor(Math.pow(Math.random(), 1.5) * weakSpots.length);
      const chosen = weakSpots[pickIdx];

      // Parse standard arithmetic keys
      const [prefix, body] = chosen.key.split(':');
      if (['add', 'sub', 'mul', 'div'].includes(prefix)) {
        let op = '+';
        if (prefix === 'sub') op = '-';
        if (prefix === 'mul') op = '*';
        if (prefix === 'div') op = '/';

        const parts = body.split(/[+x\-\/]/);
        const num1 = parseInt(parts[0], 10);
        const num2 = parseInt(parts[1], 10);

        let answer = 0;
        let opSymbol = op;
        if (op === '+') { answer = num1 + num2; opSymbol = '+'; }
        else if (op === '-') { answer = num1 - num2; opSymbol = '−'; }
        else if (op === '*') { answer = num1 * num2; opSymbol = '×'; }
        else if (op === '/') { answer = num1 / num2; opSymbol = '÷'; }

        elements.adaptiveBannerText.innerHTML = `Targeting weak spot: <strong>${num1} ${opSymbol} ${num2}</strong> (Accuracy: ${Math.round((1 - chosen.errorRate) * 100)}%)`;

        const prob = {
          type: 'basic',
          num1,
          num2,
          op,
          opSymbol,
          displayText: `${num1} ${opSymbol} ${num2} = ?`,
          answer,
          badge: 'Smart Weak-Spot Drill',
          key: chosen.key,
          box: chosen.box || 1
        };
        prob.tip = generateMentalMathTip(prob);
        return prob;
      }
    }

    // Standard Generation from Selected Operations
    const availableOps = state.selectedOps.length > 0 ? state.selectedOps : ['+'];
    const chosenOp = availableOps[Math.floor(Math.random() * availableOps.length)];
    const range = getRangeForDifficulty(state.difficulty);

    let problem;

    // Check specialist modes
    if (chosenOp === '%') {
      problem = generatePercentProblem();
    } else if (chosenOp === 'pow') {
      problem = generatePowerProblem();
    } else if (chosenOp === 'alg') {
      problem = generateAlgebraProblem(range);
    } else if (chosenOp === 'chain') {
      problem = generateChainProblem();
    } else {
      // Basic 4 arithmetic operations
      let num1, num2, answer, opSymbol, badge;

      if (chosenOp === '+') {
        num1 = randomInt(range.min, range.max);
        num2 = randomInt(range.min, range.max);
        answer = num1 + num2;
        opSymbol = '+';
        badge = 'Addition';
      } else if (chosenOp === '-') {
        const a = randomInt(range.min, range.max);
        const b = randomInt(range.min, range.max);
        num1 = Math.max(a, b);
        num2 = Math.min(a, b);
        answer = num1 - num2;
        opSymbol = '−';
        badge = 'Subtraction';
      } else if (chosenOp === '*') {
        num1 = randomInt(range.min, range.max);
        num2 = randomInt(range.min, range.max);
        answer = num1 * num2;
        opSymbol = '×';
        badge = 'Multiplication';
      } else if (chosenOp === '/') {
        const minDivisor = Math.max(1, range.min === 0 ? 1 : range.min);
        const maxDivisor = Math.max(minDivisor, range.max);
        const divisor = randomInt(minDivisor, maxDivisor);
        const quotient = randomInt(range.min, range.max);
        num1 = divisor * quotient;
        num2 = divisor;
        answer = quotient;
        opSymbol = '÷';
        badge = 'Division';
      }

      problem = {
        type: 'basic',
        num1,
        num2,
        op: chosenOp,
        opSymbol,
        displayText: `${num1} ${opSymbol} ${num2} = ?`,
        answer,
        badge,
        key: getProblemKey(chosenOp, num1, num2)
      };
    }

    problem.box = getProblemLeitnerBox(problem.key);
    problem.tip = generateMentalMathTip(problem);

    if (state.mode !== 'daily') {
      if (state.adaptiveEnabled) {
        elements.adaptiveBannerText.textContent = `Smart adaptive learning active: analyzing your response accuracy and speed.`;
      } else {
        elements.adaptiveBannerText.textContent = `Adaptive mode disabled. Problems are randomly generated.`;
      }
    }

    return problem;
  }

  // --- Screen View Navigation (Setup vs Practice) ---
  function goToPracticeView(modeName) {
    if (elements.setupView) elements.setupView.style.display = 'none';
    if (elements.practiceView) elements.practiceView.style.display = 'flex';

    if (elements.practiceModeTag) {
      const modeTitles = {
        practice: 'Practice',
        daily: 'Daily Mint',
        speedrun: '60s Sprint',
        test20: 'Target 20'
      };
      elements.practiceModeTag.textContent = modeTitles[modeName] || modeName || 'Practice';
    }

    if (elements.practiceStreak) {
      elements.practiceStreak.textContent = state.session.streak;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      if (elements.answerInput) elements.answerInput.focus();
    }, 120);
  }

  function goToSetupView() {
    // Stop all active timers
    clearInterval(state.speedrun.timer);
    clearInterval(state.timerInterval);
    state.speedrun.active = false;
    state.daily.active = false;
    state.test20.active = false;

    if (elements.speedrunBanner) elements.speedrunBanner.classList.add('hidden');
    if (elements.pauseOverlay) elements.pauseOverlay.style.display = 'none';
    state.isPaused = false;

    if (elements.practiceView) elements.practiceView.style.display = 'none';
    if (elements.setupView) elements.setupView.style.display = 'flex';

    updateStatusBar();
    updateXPDisplay();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Pause & Resume Timer ---
  function togglePause() {
    state.isPaused = !state.isPaused;

    if (state.isPaused) {
      if (state.problemStartTime) {
        state.pausedElapsedMs = Date.now() - state.problemStartTime;
      }
      clearInterval(state.timerInterval);

      if (state.mode === 'speedrun' && state.speedrun.active) {
        clearInterval(state.speedrun.timer);
      }

      if (elements.pauseOverlay) elements.pauseOverlay.style.display = 'flex';
      if (elements.pauseIcon) elements.pauseIcon.textContent = '▶️';
      if (elements.practicePauseIcon) elements.practicePauseIcon.textContent = '▶️';
      if (elements.cardPauseBtn) elements.cardPauseBtn.textContent = '▶️';
      if (elements.speedrunPauseBtn) elements.speedrunPauseBtn.textContent = '▶️ Resume';

      elements.answerInput.disabled = true;
      showToast('Timer paused (P)');
    } else {
      if (state.problemStartTime) {
        state.problemStartTime = Date.now() - state.pausedElapsedMs;
      }
      startLiveTimer();

      if (state.mode === 'speedrun' && state.speedrun.active) {
        startSpeedrunCountdown();
      }

      if (elements.pauseOverlay) elements.pauseOverlay.style.display = 'none';
      if (elements.pauseIcon) elements.pauseIcon.textContent = '⏸️';
      if (elements.practicePauseIcon) elements.practicePauseIcon.textContent = '⏸️';
      if (elements.cardPauseBtn) elements.cardPauseBtn.textContent = '⏸️';
      if (elements.speedrunPauseBtn) elements.speedrunPauseBtn.textContent = '⏸️ Pause';

      elements.answerInput.disabled = false;
      elements.answerInput.focus();
      showToast('Timer resumed');
    }
  }

  // --- Display Problem on Flashcard ---
  function showNextProblem() {
    state.cardFlipped = false;
    elements.flashcard.classList.remove('flipped');
    elements.cardFeedback.textContent = '';
    elements.cardFeedback.className = 'card-feedback';

    if (state.isPaused) {
      state.isPaused = false;
      if (elements.pauseOverlay) elements.pauseOverlay.style.display = 'none';
      if (elements.pauseIcon) elements.pauseIcon.textContent = '⏸️';
      if (elements.cardPauseBtn) elements.cardPauseBtn.textContent = '⏸️';
      if (elements.speedrunPauseBtn) elements.speedrunPauseBtn.textContent = '⏸️ Pause';
      elements.answerInput.disabled = false;
    }
    state.pausedElapsedMs = 0;

    state.currentProblem = generateProblem();
    state.problemStartTime = Date.now();

    // Render Math Problem text
    if (state.currentProblem.displayText) {
      elements.problemText.innerHTML = state.currentProblem.displayText.replace(
        '?',
        `<span class="math-placeholder" id="placeholder-val">?</span>`
      );
    } else {
      elements.num1.textContent = state.currentProblem.num1;
      elements.num2.textContent = state.currentProblem.num2;
      elements.opSymbol.textContent = state.currentProblem.opSymbol;
      elements.placeholderVal.textContent = '?';
      elements.placeholderVal.style.color = '';
    }

    // Badges & Solution
    elements.cardBadge.textContent = state.currentProblem.badge;
    const boxNum = state.currentProblem.box || 1;
    elements.leitnerBadge.textContent = `📦 Box ${boxNum}`;
    elements.solutionAnswer.textContent = state.currentProblem.answer;
    elements.solutionTip.innerHTML = `<strong>Mental Tip:</strong> ${state.currentProblem.tip}`;

    elements.answerInput.value = '';
    elements.answerInput.focus();

    startLiveTimer();
  }

  function startLiveTimer() {
    clearInterval(state.timerInterval);
    elements.timerIndicator.textContent = '⏱️ 0.0s';

    state.timerInterval = setInterval(() => {
      if (!state.problemStartTime) return;
      const elapsed = ((Date.now() - state.problemStartTime) / 1000).toFixed(1);
      elements.timerIndicator.textContent = `⏱️ ${elapsed}s`;
    }, 100);
  }

  // --- Answer Checking & Storage ---
  function checkAnswer() {
    if (state.isPaused) {
      togglePause();
      return;
    }

    const rawVal = elements.answerInput.value.trim();
    if (rawVal === '') {
      elements.answerInput.focus();
      return;
    }

    const userAnswer = parseInt(rawVal, 10);
    const latencyMs = Date.now() - state.problemStartTime;
    const isCorrect = userAnswer === state.currentProblem.answer;

    clearInterval(state.timerInterval);

    // Save in storage with Leitner box progression
    recordProblemAttempt(state.currentProblem.key, isCorrect, latencyMs);

    state.session.totalAttempted++;
    state.session.latencies.push(latencyMs);

    const ph = document.getElementById('placeholder-val');

    if (isCorrect) {
      sound.playCorrect();
      state.session.totalCorrect++;
      state.session.streak++;
      if (state.session.streak > state.session.bestStreak) {
        state.session.bestStreak = state.session.streak;
      }

      // Mint Leaves XP Calculation
      let leavesGained = 10;
      if (latencyMs < 2000) leavesGained += 5; // Fast answer bonus
      if (state.session.streak > 0 && state.session.streak % 5 === 0) leavesGained += 15; // Streak milestone bonus
      awardLeaves(leavesGained, latencyMs < 2000 ? 'Speed bonus!' : 'Streak milestone!');

      if (ph) {
        ph.textContent = userAnswer;
        ph.style.color = 'var(--accent-correct)';
      }
      elements.cardFeedback.textContent = `✨ Correct! (${(latencyMs / 1000).toFixed(1)}s)`;
      elements.cardFeedback.className = 'card-feedback correct';

      // Mode handlers
      if (state.mode === 'speedrun' && state.speedrun.active) {
        state.speedrun.score++;
        updateGhostRace();
      } else if (state.mode === 'test20' && state.test20.active) {
        state.test20.correct++;
        advanceTestProgress();
      } else if (state.mode === 'daily' && state.daily.active) {
        state.daily.correct++;
        advanceDailyProgress();
      }

      setTimeout(() => {
        const challengeStillActive =
          state.mode === 'speedrun' ||
          (state.mode === 'daily' && state.daily.active) ||
          (state.mode === 'test20' && state.test20.active);
        if (state.mode === 'practice' || challengeStillActive) {
          showNextProblem();
        }
      }, 550);
    } else {
      sound.playWrong();
      state.session.streak = 0;

      if (ph) {
        ph.textContent = userAnswer;
        ph.style.color = 'var(--accent-wrong)';
      }
      elements.cardFeedback.textContent = `Incorrect. Answer is ${state.currentProblem.answer}`;
      elements.cardFeedback.className = 'card-feedback wrong';

      setTimeout(() => {
        flipCard(true);
      }, 400);

      if (state.mode === 'test20' && state.test20.active) {
        advanceTestProgress();
      } else if (state.mode === 'daily' && state.daily.active) {
        advanceDailyProgress();
      }
    }

    updateStatusBar();
  }

  function recordProblemAttempt(key, isCorrect, latencyMs) {
    const data = loadUserData();
    if (!data.problems[key]) {
      data.problems[key] = {
        attempts: 0,
        correct: 0,
        wrong: 0,
        box: 1,
        lastLatencyMs: latencyMs,
        lastSeen: Date.now()
      };
    }

    const rec = data.problems[key];
    rec.attempts++;
    if (isCorrect) {
      rec.correct++;
      // Advance Leitner Box: Box 1 -> Box 5
      rec.box = Math.min(5, (rec.box || 1) + 1);
    } else {
      rec.wrong++;
      // Demote to Box 1 on error
      rec.box = 1;
    }
    rec.lastLatencyMs = latencyMs;
    rec.lastSeen = Date.now();

    data.overall.totalAttempted++;
    if (isCorrect) data.overall.totalCorrect++;
    data.overall.sumLatencyMs += latencyMs;
    if (state.session.streak > (data.overall.bestStreak || 0)) {
      data.overall.bestStreak = state.session.streak;
    }

    saveUserData(data);
  }

  function updateStatusBar() {
    elements.statStreak.textContent = state.session.streak;
    elements.statBestStreak.textContent = state.session.bestStreak;

    if (state.session.totalAttempted > 0) {
      const acc = Math.round((state.session.totalCorrect / state.session.totalAttempted) * 100);
      elements.statAccuracy.textContent = `${acc}%`;

      const avgMs =
        state.session.latencies.reduce((a, b) => a + b, 0) / state.session.latencies.length;
      elements.statAvgTime.textContent = `${(avgMs / 1000).toFixed(1)}s`;
    } else {
      elements.statAccuracy.textContent = '100%';
      elements.statAvgTime.textContent = '--';
    }
  }

  function flipCard(forceState) {
    if (typeof forceState === 'boolean') {
      state.cardFlipped = forceState;
    } else {
      state.cardFlipped = !state.cardFlipped;
    }

    if (state.cardFlipped) {
      elements.flashcard.classList.add('flipped');
    } else {
      elements.flashcard.classList.remove('flipped');
    }
  }

  // --- Ghost Race & Speedrun (#2 Gamification) ---
  function startSpeedrunCountdown() {
    clearInterval(state.speedrun.timer);
    state.speedrun.timer = setInterval(() => {
      state.speedrun.timeLeft--;
      elements.speedrunVal.textContent = `${state.speedrun.timeLeft}s`;

      updateGhostRace();

      if (state.speedrun.timeLeft <= 0) {
        clearInterval(state.speedrun.timer);
        state.speedrun.active = false;
        elements.speedrunBanner.classList.add('hidden');

        // Check if PB beaten
        const data = loadUserData();
        const curPB = data.gamification.bestSpeedrunScore || 12;
        if (state.speedrun.score > curPB) {
          data.gamification.bestSpeedrunScore = state.speedrun.score;
          saveUserData(data);
          awardLeaves(100, 'New Personal Record!');
          alert(`🏆 NEW RECORD! You solved ${state.speedrun.score} problems and beat your ghost! (+100 Mint Leaves!)`);
        } else {
          awardLeaves(25, 'Sprint completed');
          alert(`⏱️ Sprint Finished! You solved ${state.speedrun.score} problems in 60s! Ghost record: ${curPB}`);
        }
      }
    }, 1000);
  }

  function startSpeedrun() {
    const data = loadUserData();
    const pb = (data.gamification && data.gamification.bestSpeedrunScore) || 12;

    state.speedrun.active = true;
    state.speedrun.timeLeft = 60;
    state.speedrun.score = 0;
    state.speedrun.ghostTargetScore = pb;

    elements.speedrunBanner.classList.remove('hidden');
    elements.speedrunTitle.textContent = '⏳ 60s Sprint';
    elements.speedrunVal.textContent = '60s';
    elements.ghostTrack = document.getElementById('ghost-track');
    if (elements.ghostTrack) elements.ghostTrack.style.display = 'flex';

    goToPracticeView('speedrun');
    updateGhostRace();
    startSpeedrunCountdown();
    showNextProblem();
  }

  function updateGhostRace() {
    const elapsed = 60 - state.speedrun.timeLeft;
    const ghostPace = Math.floor((elapsed / 60) * state.speedrun.ghostTargetScore);

    elements.userRunnerScore.textContent = state.speedrun.score;
    elements.ghostRunnerScore.textContent = ghostPace;

    const maxExpected = Math.max(state.speedrun.ghostTargetScore, 20);
    const userPct = Math.min(100, (state.speedrun.score / maxExpected) * 100);
    const ghostPct = Math.min(100, (ghostPace / maxExpected) * 100);

    elements.userFill.style.width = `${userPct}%`;
    elements.ghostFill.style.width = `${ghostPct}%`;
  }

  // --- Daily Mint Mode (#2 Habits) ---
  function startDailyMint() {
    const today = getTodayString();
    const rng = createSeededRNG(today);

    // Deterministically generate 15 balanced questions for today
    const dailyQuestions = [];
    const diffRange = { min: 0, max: 15 };

    // 4 Addition / Subtraction
    for (let i = 0; i < 4; i++) {
      const isAdd = i % 2 === 0;
      const n1 = randomInt(diffRange.min, diffRange.max, rng);
      const n2 = randomInt(diffRange.min, diffRange.max, rng);
      const ans = isAdd ? n1 + n2 : Math.max(n1, n2) - Math.min(n1, n2);
      const opSym = isAdd ? '+' : '−';
      const a = isAdd ? n1 : Math.max(n1, n2);
      const b = isAdd ? n2 : Math.min(n1, n2);
      dailyQuestions.push({
        type: 'basic',
        num1: a,
        num2: b,
        op: isAdd ? '+' : '-',
        opSymbol: opSym,
        displayText: `${a} ${opSym} ${b} = ?`,
        answer: ans,
        badge: 'Daily Mint • Arithmetic',
        key: getProblemKey(isAdd ? '+' : '-', a, b)
      });
    }

    // 4 Multiplication / Division
    for (let i = 0; i < 4; i++) {
      const isMul = i % 2 === 0;
      const n1 = randomInt(2, 12, rng);
      const n2 = randomInt(2, 12, rng);
      if (isMul) {
        dailyQuestions.push({
          type: 'basic',
          num1: n1,
          num2: n2,
          op: '*',
          opSymbol: '×',
          displayText: `${n1} × ${n2} = ?`,
          answer: n1 * n2,
          badge: 'Daily Mint • Multiplication',
          key: getProblemKey('*', n1, n2)
        });
      } else {
        const dividend = n1 * n2;
        dailyQuestions.push({
          type: 'basic',
          num1: dividend,
          num2: n1,
          op: '/',
          opSymbol: '÷',
          displayText: `${dividend} ÷ ${n1} = ?`,
          answer: n2,
          badge: 'Daily Mint • Division',
          key: getProblemKey('/', dividend, n1)
        });
      }
    }

    // 3 Percentages / Tips
    for (let i = 0; i < 3; i++) {
      dailyQuestions.push(generatePercentProblem(rng));
    }

    // 2 Powers / Roots
    for (let i = 0; i < 2; i++) {
      dailyQuestions.push(generatePowerProblem(rng));
    }

    // 2 Missing Operand / Algebra
    for (let i = 0; i < 2; i++) {
      dailyQuestions.push(generateAlgebraProblem(diffRange, rng));
    }

    // Attach tips & Leitner box to all
    dailyQuestions.forEach((q) => {
      q.tip = generateMentalMathTip(q);
      q.box = getProblemLeitnerBox(q.key);
    });

    state.daily.active = true;
    state.daily.questions = dailyQuestions;
    state.daily.currentIndex = 0;
    state.daily.correct = 0;
    state.daily.dateStr = today;

    elements.speedrunBanner.classList.remove('hidden');
    elements.speedrunTitle.textContent = '📅 Daily Mint Progress:';
    elements.speedrunVal.textContent = `1 / 15`;
    const ghostTrack = document.getElementById('ghost-track');
    if (ghostTrack) ghostTrack.style.display = 'none';

    goToPracticeView('daily');
    showNextProblem();
  }

  function advanceDailyProgress() {
    state.daily.currentIndex++;
    if (state.daily.currentIndex >= state.daily.questions.length) {
      // Completed Daily Mint!
      elements.speedrunBanner.classList.add('hidden');
      state.daily.active = false;

      const data = loadUserData();
      const today = getTodayString();
      const alreadyDone = data.gamification.lastDailyDate === today;

      if (!alreadyDone) {
        data.gamification.dailyStreak = (data.gamification.dailyStreak || 0) + 1;
        data.gamification.lastDailyDate = today;
        saveUserData(data);
        awardLeaves(50, 'Daily Mint Complete!');
      }

      updateXPDisplay();

      const score = state.daily.correct;
      alert(`🌿 Daily Mint Finished!\nScore: ${score} / 15\nStreak: ${data.gamification.dailyStreak} Days in a row! 🏆\nBonus: +50 Mint Leaves!`);
      goToSetupView();
    } else {
      elements.speedrunVal.textContent = `${state.daily.currentIndex + 1} / 15`;
    }
  }

  // --- Target 20 Mode ---
  function startTest20() {
    state.test20.active = true;
    state.test20.currentIndex = 0;
    state.test20.correct = 0;
    elements.speedrunBanner.classList.remove('hidden');
    elements.speedrunTitle.textContent = '📝 Target 20 Progress:';
    elements.speedrunVal.textContent = `1 / 20`;
    const ghostTrack = document.getElementById('ghost-track');
    if (ghostTrack) ghostTrack.style.display = 'none';
    goToPracticeView('test20');
    showNextProblem();
  }

  function advanceTestProgress() {
    state.test20.currentIndex++;
    if (state.test20.currentIndex >= state.test20.total) {
      elements.speedrunBanner.classList.add('hidden');
      state.test20.active = false;
      const scorePct = Math.round((state.test20.correct / state.test20.total) * 100);
      awardLeaves(30, 'Test completed');
      alert(`🏁 Test Complete!\nScore: ${state.test20.correct} / 20 (${scorePct}%)\n${scorePct >= 90 ? '🌟 Outstanding Master!' : scorePct >= 75 ? '👏 Great job!' : '💪 Keep practicing your weak spots!'}`);
      goToSetupView();
    } else {
      elements.speedrunVal.textContent = `${state.test20.currentIndex + 1} / 20`;
    }
  }

  // Generic Session Launcher
  function startCurrentSession() {
    if (state.mode === 'daily') {
      startDailyMint();
    } else if (state.mode === 'speedrun') {
      startSpeedrun();
    } else if (state.mode === 'test20') {
      startTest20();
    } else {
      goToPracticeView('practice');
      showNextProblem();
    }
  }

  // --- Analytics & Leitner Box Drawer Renderer ---
  function openAnalyticsModal() {
    const data = loadUserData();
    const total = data.overall.totalAttempted || 0;
    const correct = data.overall.totalCorrect || 0;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    elements.mTotalSolved.textContent = total;
    elements.mOverallAccuracy.textContent = `${accuracy}%`;
    elements.mBestStreak.textContent = data.overall.bestStreak || state.session.bestStreak;

    updateXPDisplay();

    // Render 5 Leitner Boxes
    renderLeitnerShelf(data);

    // Weak Spots List
    elements.weaknessList.innerHTML = '';
    const weakSpots = getStrugglingProblems();

    if (weakSpots.length === 0) {
      elements.weaknessList.innerHTML = `<div style="font-size:0.85rem; color:var(--text-muted); padding: 0.5rem 0;">No weak spots detected yet! Keep practicing to calibrate.</div>`;
    } else {
      weakSpots.slice(0, 5).forEach((spot) => {
        const item = document.createElement('div');
        item.className = 'weakness-item';
        const accPct = Math.round(((spot.attempts - spot.wrong) / spot.attempts) * 100);

        item.innerHTML = `
          <div>
            <span class="weakness-badge">${spot.key.replace(':', ' ')}</span>
            <span style="font-size:0.75rem; color:var(--text-muted); margin-left:8px;">(${spot.attempts} tries)</span>
          </div>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span class="weakness-rate">${accPct}% acc</span>
            <button class="practice-weak-btn" data-key="${spot.key}">Practice</button>
          </div>
        `;

        item.querySelector('.practice-weak-btn').addEventListener('click', () => {
          elements.analyticsModal.classList.remove('open');
          state.targetDrillWeakSpot = true;
          showNextProblem();
        });

        elements.weaknessList.appendChild(item);
      });
    }

    // Strong Spots
    elements.strengthList.innerHTML = '';
    const mastered = [];
    for (const [key, rec] of Object.entries(data.problems)) {
      if (rec.attempts >= 3 && rec.wrong === 0) {
        mastered.push({ key, ...rec });
      }
    }
    mastered.sort((a, b) => b.attempts - a.attempts);

    if (mastered.length === 0) {
      elements.strengthList.innerHTML = `<div style="font-size:0.85rem; color:var(--text-muted); padding: 0.5rem 0;">Get 3+ correct answers on a problem with 100% accuracy to master it.</div>`;
    } else {
      mastered.slice(0, 5).forEach((m) => {
        const item = document.createElement('div');
        item.className = 'weakness-item';
        item.innerHTML = `
          <div>
            <span class="weakness-badge" style="color:var(--mint-600);">${m.key.replace(':', ' ')}</span>
          </div>
          <span style="font-size:0.8rem; font-weight:700; color:var(--mint-600);">🌟 Mastered (${m.correct} hits)</span>
        `;
        elements.strengthList.appendChild(item);
      });
    }

    // Times Table Heatmap Matrix
    renderHeatmap(data);

    elements.analyticsModal.classList.add('open');
  }

  function renderLeitnerShelf(data) {
    const boxCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const rec of Object.values(data.problems)) {
      const b = rec.box || 1;
      if (boxCounts[b] !== undefined) boxCounts[b]++;
    }

    elements.leitnerShelf.innerHTML = '';
    const labels = [
      { num: 1, title: 'Box 1', tag: 'Daily Review' },
      { num: 2, title: 'Box 2', tag: 'Every 2-3 Days' },
      { num: 3, title: 'Box 3', tag: 'Weekly' },
      { num: 4, title: 'Box 4', tag: 'Bi-Weekly' },
      { num: 5, title: 'Box 5', tag: 'Mastered 🎓' }
    ];

    labels.forEach((b) => {
      const card = document.createElement('div');
      card.className = `leitner-box-card ${state.activeLeitnerFilter === b.num ? 'active-filter' : ''}`;
      card.innerHTML = `
        <div class="leitner-box-title">${b.title}</div>
        <div class="leitner-box-count">${boxCounts[b.num]}</div>
        <div class="leitner-box-tag">${b.tag}</div>
      `;
      card.addEventListener('click', () => {
        if (boxCounts[b.num] === 0) {
          showToast(`No problems currently in ${b.title}!`);
          return;
        }
        state.activeLeitnerFilter = state.activeLeitnerFilter === b.num ? null : b.num;
        elements.analyticsModal.classList.remove('open');
        showToast(state.activeLeitnerFilter ? `Filtering practice to Box ${b.num}` : 'Cleared box filter');
        showNextProblem();
      });
      elements.leitnerShelf.appendChild(card);
    });
  }

  function renderHeatmap(data) {
    elements.heatmapGrid.innerHTML = '';
    for (let r = 1; r <= 12; r++) {
      for (let c = 1; c <= 12; c++) {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        cell.textContent = `${r * c}`;
        const key = getProblemKey('*', r, c);
        const stat = data.problems[key];

        if (stat) {
          const acc = (stat.attempts - stat.wrong) / stat.attempts;
          if (stat.attempts >= 2 && acc >= 0.85) {
            cell.classList.add('mastered');
            cell.title = `${r} × ${c} = ${r * c}: Mastered (${Math.round(acc * 100)}% acc)`;
          } else if (acc < 0.6) {
            cell.classList.add('struggling');
            cell.title = `${r} × ${c} = ${r * c}: Struggling (${Math.round(acc * 100)}% acc)`;
          } else {
            cell.classList.add('learning');
            cell.title = `${r} × ${c} = ${r * c}: In progress (${Math.round(acc * 100)}% acc)`;
          }
        } else {
          cell.title = `${r} × ${c} = ${r * c}: Not attempted`;
        }

        cell.addEventListener('click', () => {
          elements.analyticsModal.classList.remove('open');
          state.currentProblem = {
            type: 'basic',
            num1: r,
            num2: c,
            op: '*',
            opSymbol: '×',
            displayText: `${r} × ${c} = ?`,
            answer: r * c,
            badge: 'Matrix Focus',
            key,
            box: (stat && stat.box) || 1
          };
          state.currentProblem.tip = generateMentalMathTip(state.currentProblem);
          elements.problemText.innerHTML = `${r} × ${c} = <span class="math-placeholder" id="placeholder-val">?</span>`;
          elements.cardBadge.textContent = 'Matrix Practice';
          elements.leitnerBadge.textContent = `📦 Box ${state.currentProblem.box}`;
          elements.solutionAnswer.textContent = r * c;
          elements.solutionTip.innerHTML = `<strong>Mental Tip:</strong> ${state.currentProblem.tip}`;
          elements.cardFeedback.textContent = '';
          elements.answerInput.value = '';
          elements.answerInput.focus();
          startLiveTimer();
        });

        elements.heatmapGrid.appendChild(cell);
      }
    }
  }

  // --- Theme & Sound Toggles ---
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    elements.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    const settings = loadSettings();
    settings.theme = next;
    saveSettings(settings);
  }

  function toggleSound() {
    sound.enabled = !sound.enabled;
    elements.soundIcon.textContent = sound.enabled ? '🔊' : '🔇';
    showToast(sound.enabled ? 'Sound enabled' : 'Sound muted');
  }

  // --- PWA Installation (#4) ---
  let deferredPrompt = null;
  function setupPWA() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('SW registration failed:', err);
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (elements.installBtn) {
        elements.installBtn.style.display = 'flex';
      }
    });

    if (elements.installBtn) {
      elements.installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          showToast('🌿 Thank you for installing Mintal Math!');
          elements.installBtn.style.display = 'none';
        }
        deferredPrompt = null;
      });
    }
  }

  // --- Setup Event Listeners ---
  function setupEvents() {
    elements.answerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (state.cardFlipped) showNextProblem();
      else checkAnswer();
    });

    elements.submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (state.cardFlipped) showNextProblem();
      else checkAnswer();
    });

    elements.flipBtn.addEventListener('click', () => flipCard());
    elements.flashcard.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON') flipCard();
    });
    elements.skipBtn.addEventListener('click', () => showNextProblem());
    elements.startSessionBtn.addEventListener('click', startCurrentSession);
    elements.startDailyBtn.addEventListener('click', () => {
      state.mode = 'daily';
      startDailyMint();
    });
    elements.setupWeakspotsBtn.addEventListener('click', () => {
      state.targetDrillWeakSpot = true;
      startCurrentSession();
    });
    elements.setupMasteryBtn.addEventListener('click', openAnalyticsModal);
    elements.exitPracticeBtn.addEventListener('click', goToSetupView);

    elements.themeBtn.addEventListener('click', toggleTheme);
    elements.soundBtn.addEventListener('click', toggleSound);
    elements.analyticsBtn.addEventListener('click', openAnalyticsModal);
    elements.viewWeakspotsBtn.addEventListener('click', openAnalyticsModal);
    elements.leavesBadge.addEventListener('click', openAnalyticsModal);

    elements.closeModalBtn.addEventListener('click', () => elements.analyticsModal.classList.remove('open'));
    elements.closeModalBottomBtn.addEventListener('click', () => elements.analyticsModal.classList.remove('open'));

    elements.drillWeakspotsBtn.addEventListener('click', () => {
      elements.analyticsModal.classList.remove('open');
      state.targetDrillWeakSpot = true;
      showToast('🎯 Weak spots drill started!');
      showNextProblem();
    });

    elements.resetStatsBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your local history and start fresh?')) {
        localStorage.removeItem(STORAGE_KEY);
        state.session = {
          streak: 0,
          bestStreak: 0,
          totalAttempted: 0,
          totalCorrect: 0,
          latencies: []
        };
        updateStatusBar();
        updateXPDisplay();
        openAnalyticsModal();
        showToast('Storage reset successfully');
      }
    });

    // Mode Selector
    document.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        const mode = btn.dataset.mode;
        state.mode = mode;

        if (mode === 'daily') {
          startDailyMint();
        } else if (mode === 'speedrun') {
          startSpeedrun();
        } else if (mode === 'test20') {
          startTest20();
        } else {
          // Standard practice
          clearInterval(state.speedrun.timer);
          elements.speedrunBanner.classList.add('hidden');
          showNextProblem();
        }
      });
    });

    // Operation Pills (All: Arithmetic + Specialist)
    document.querySelectorAll('.op-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        const op = pill.dataset.op;
        if (state.selectedOps.includes(op)) {
          if (state.selectedOps.length > 1) {
            state.selectedOps = state.selectedOps.filter((o) => o !== op);
            pill.classList.remove('active');
          } else {
            showToast('Keep at least one operation active');
          }
        } else {
          state.selectedOps.push(op);
          pill.classList.add('active');
        }
        state.targetDrillWeakSpot = false;
        state.activeLeitnerFilter = null;
        showNextProblem();
      });
    });

    // Difficulty Tabs
    document.querySelectorAll('.diff-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const diff = btn.dataset.diff;
        state.difficulty = diff;

        if (diff === 'custom') elements.customRangeBox.classList.add('open');
        else elements.customRangeBox.classList.remove('open');

        state.targetDrillWeakSpot = false;
        state.activeLeitnerFilter = null;
        showNextProblem();
      });
    });

    // Custom Sliders
    elements.customMinSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      state.customMin = val;
      elements.customMinVal.textContent = val;
      if (state.difficulty === 'custom') showNextProblem();
    });

    elements.customMaxSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      state.customMax = val;
      elements.customMaxVal.textContent = val;
      if (state.difficulty === 'custom') showNextProblem();
    });

    // Adaptive Learning Switch
    elements.adaptiveToggle.addEventListener('change', (e) => {
      state.adaptiveEnabled = e.target.checked;
      showToast(state.adaptiveEnabled ? 'Adaptive learning enabled' : 'Adaptive learning paused');
      showNextProblem();
    });

    // Numpad Toggle & Clicks
    elements.numpadToggle.addEventListener('click', () => {
      const isVisible = elements.numpad.style.display === 'grid';
      elements.numpad.style.display = isVisible ? 'none' : 'grid';
      elements.numpadToggle.textContent = isVisible ? 'Show Touch Numpad' : 'Hide Touch Numpad';
    });

    elements.numpad.querySelectorAll('.numpad-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        if (key === 'clear') {
          elements.answerInput.value = '';
        } else if (key === 'backspace') {
          elements.answerInput.value = elements.answerInput.value.slice(0, -1);
        } else {
          elements.answerInput.value += key;
        }
        elements.answerInput.focus();
      });
    });

    // Pause Timer Listeners
    if (elements.pauseBtn) elements.pauseBtn.addEventListener('click', togglePause);
    if (elements.cardPauseBtn) elements.cardPauseBtn.addEventListener('click', togglePause);
    if (elements.speedrunPauseBtn) elements.speedrunPauseBtn.addEventListener('click', togglePause);
    if (elements.resumeBtn) elements.resumeBtn.addEventListener('click', togglePause);

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (elements.analyticsModal.classList.contains('open')) {
        if (e.key === 'Escape') elements.analyticsModal.classList.remove('open');
        return;
      }
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePause();
        return;
      }
      if (e.key === ' ' && document.activeElement !== elements.answerInput) {
        e.preventDefault();
        flipCard();
      } else if (e.key === 'Escape') {
        elements.answerInput.value = '';
      }
    });
  }

  // --- Initialization ---
  function init() {
    const settings = loadSettings();
    applyTheme(settings.theme || 'light');
    setupPWA();
    setupEvents();
    updateStatusBar();
    updateXPDisplay();
    showNextProblem();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
