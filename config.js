// Весь баланс игры — здесь. Меняйте цены, скорость и вместимость без правок остального кода.
export const CFG = {
  logValue: 5,          // монет за одно сданное бревно
  treeRespawn: 30,      // секунд до появления нового дерева
  pickRadius: 1.7, hitRange: 2.0, bigLvl: 3,  // bigLvl: уровень для «древних» деревьев (больше HP и брёвен)
  xp: { chop: 2, pick: 1, deliver: 3 },
  axes: [
    { id: 'old',     name: 'Старый топор',      price: 0,     speed: 1,   lvl: 1, head: 0x8a8a8a },
    { id: 'iron',    name: 'Железный топор',    price: 250,   speed: 1.5, lvl: 1, head: 0xb7c0c8 },
    { id: 'steel',   name: 'Стальной топор',    price: 750,   speed: 2,   lvl: 2, head: 0xe3eaf2 },
    { id: 'gold',    name: 'Золотой топор',     price: 2000,  speed: 3,   lvl: 4, head: 0xffc928, glow: 0x553c00 },
    { id: 'crystal', name: 'Кристальный топор', price: 5000,  speed: 4,   lvl: 6, head: 0x4de6ff, glow: 0x0a5566 },
    { id: 'legend',  name: 'Легендарный топор', price: 15000, speed: 6,   lvl: 9, head: 0xff4de1, glow: 0x66105a },
  ],
  bags: [
    { id: 'small',  name: 'Маленький',       cap: 5,   price: 0,     lvl: 1, color: 0x8a6a45 },
    { id: 'normal', name: 'Обычный',         cap: 10,  price: 300,   lvl: 1, color: 0x3f7f4a },
    { id: 'big',    name: 'Большой',         cap: 20,  price: 900,   lvl: 2, color: 0x2f5fb0 },
    { id: 'strong', name: 'Усиленный',       cap: 35,  price: 2500,  lvl: 3, color: 0x7a3fb0 },
    { id: 'pro',    name: 'Профессиональный',cap: 50,  price: 6000,  lvl: 5, color: 0xc0412f },
    { id: 'legend', name: 'Легендарный',     cap: 100, price: 20000, lvl: 8, color: 0xe8b923 },
  ],
  quests: [
    { id: 'q1', text: 'Срубить деревьев', stat: 'trees',     goal: 10, reward: 150 },
    { id: 'q2', text: 'Подобрать брёвен', stat: 'picked',    goal: 40, reward: 300 },
    { id: 'q3', text: 'Сдать брёвен',     stat: 'delivered', goal: 60, reward: 600 },
  ],
};
