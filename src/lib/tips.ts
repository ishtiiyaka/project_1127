/**
 * Domain-specific motivational tips.
 * Selected daily based on day number so you get a fresh tip each day.
 */

const TIPS: Record<string, string[]> = {
  ai: [
    "Train your attention like you train a model — focused sessions beat random exposure.",
    "Build one small project daily. Code that runs beats theory that sits.",
    "Understand backpropagation deeply once — it unlocks everything else in deep learning.",
    "MLOps is 70% of the job. Learn Docker, CI/CD, and monitoring early.",
    "Read one paper summary per week. Keeping up compounds over 1127 days.",
    "Implement algorithms from scratch before using libraries. Understanding > shortcuts.",
    "The best ML engineers debug by intuition. Build that intuition with deliberate practice.",
    "Data quality matters more than model complexity. Learn data cleaning obsessively.",
    "Every expert was once a beginner who refused to quit after the 100th error.",
    "LLMs are tools, not magic. Knowing the fundamentals puts you ahead of 90%.",
  ],
  chinese: [
    "Tones are non-negotiable. 5 minutes of tone drilling daily beats 1 hour weekly.",
    "Learn radicals first — they're the alphabet of Chinese characters.",
    "Watch one Chinese video daily without subtitles. Your brain will adapt.",
    "Speak out loud every day, even alone. Silent reading won't make you fluent.",
    "HSK 4 vocabulary: 1200 words. At 10/day, you finish in 4 months.",
    "Shadow native speakers. Copy rhythm, speed, and intonation exactly.",
    "Write characters by hand. Muscle memory accelerates recognition.",
    "Find a language exchange partner. Real conversation beats textbooks every time.",
    "Listening comprehension lags behind reading. Prioritize audio input daily.",
    "Consistency beats intensity. 30 minutes daily beats 4 hours on weekends.",
  ],
  robotics: [
    "ROS2 is the language of modern robotics. Master topics, nodes, and transforms first.",
    "Kinematics on paper before code. Understand forward/inverse before implementing.",
    "Every robot failure is data. Log everything, analyze methodically.",
    "Control systems are the heart. PID first, then MPC, then advanced methods.",
    "Sensor fusion is where the magic happens. Learn EKF and UKF deeply.",
    "Build a physical prototype early — simulation lies, hardware teaches truth.",
    "Read robotics papers weekly. The field moves fast and you need to move faster.",
    "CAD skills matter. SolidWorks or Fusion 360 — pick one and master it.",
    "URDF/SDF modeling: your robot must exist digitally before physically.",
    "Debugging embedded + perception + planning simultaneously requires systematic thinking.",
  ],
  embedded: [
    "Read datasheets from the beginning. Every answer is there if you look.",
    "Oscilloscopes and logic analyzers are your debuggers in hardware world.",
    "Learn I2C, SPI, UART inside out — they're in every embedded project.",
    "RTOS fundamentals: tasks, queues, semaphores. They solve 80% of timing issues.",
    "Write interrupt handlers that do minimal work. Offload to task context always.",
    "Power consumption is a first-class feature in embedded systems. Profile early.",
    "Version control your firmware from day one. Git saves careers.",
    "Unit test your HAL layer. Embedded software is real software.",
    "Memory is precious. Understand stack vs heap vs static allocation.",
    "bootloaders, linker scripts, startup code — know what happens before main().",
  ],
  finance: [
    "Compound interest is the 8th wonder. Model it in spreadsheets until it's intuitive.",
    "Read one financial statement per week. Balance sheets speak if you listen.",
    "Trading and investing are different skills. Master the distinction before mixing them.",
    "Risk management first, returns second. Professionals control downside obsessively.",
    "Backtest every strategy before risking capital. Data beats opinions.",
    "Warren Buffett spent 10 years reading before investing seriously. Read more.",
    "Understanding business models is the edge most traders lack. Study industries.",
    "Position sizing matters more than entry points. A great trade can still ruin you.",
    "Keep a trading journal. Pattern recognition requires recorded data.",
    "Macro awareness separates good traders from great ones. Read broadly.",
  ],
  general: [
    "The person you'll be in 3 years is being built by today's 1 hour of deliberate work.",
    "Discipline is choosing between what you want now and what you want most.",
    "Every day logged is a vote for the person you're becoming.",
    "Hard days are part of the contract. You signed knowing this.",
    "Progress is invisible until it's undeniable. Trust the process.",
    "Your future self is watching how you handle this moment of resistance.",
    "The 1127-day commit separates dreamers from builders. You're a builder.",
    "Small actions, compounded daily, create outcomes that look like miracles.",
    "Showing up on the hard days is the entire job description.",
    "You don't rise to the level of your goals — you fall to the level of your systems.",
  ],
};

function getDomainForGoal(goalName: string): string {
  const name = goalName.toLowerCase();
  if (name.includes('ai') || name.includes('machine learning') || name.includes('engineering') || name.includes('ml')) return 'ai';
  if (name.includes('chinese') || name.includes('hsk') || name.includes('mandarin')) return 'chinese';
  if (name.includes('robot')) return 'robotics';
  if (name.includes('embedded') || name.includes('firmware') || name.includes('microcontroller')) return 'embedded';
  if (name.includes('finance') || name.includes('trading') || name.includes('business')) return 'finance';
  return 'general';
}

export function getDailyTip(goalName: string, dayNumber: number): string {
  const domain = getDomainForGoal(goalName);
  const tips = TIPS[domain] ?? TIPS['general'];
  return tips[dayNumber % tips.length];
}

export function getDailyGeneralTip(dayNumber: number): string {
  const tips = TIPS['general'];
  return tips[dayNumber % tips.length];
}
