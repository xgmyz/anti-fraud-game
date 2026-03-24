/**
 * ========================================
 * 反诈大冒险游戏 - 主游戏逻辑
 * ========================================
 * 本游戏采用纯前端技术实现，包含以下核心模块：
 * 1. 游戏状态管理（localStorage存储进度）
 * 2. 三个独立关卡的游戏逻辑
 * 3. 页面路由与切换
 * 4. 响应式交互适配
 */

// ========================================
// 音频管理器 - 使用Web Audio API生成音效
// ========================================
const audioManager = {
    // 音频上下文
    ctx: null,
    // 是否静音
    muted: false,
    // BGM振荡器
    bgmOscillator: null,
    // BGM增益节点
    bgmGain: null,
    // 当前BGM音符索引
    bgmNoteIndex: 0,
    // BGM定时器
    bgmTimer: null,

    /**
     * 初始化音频上下文
     */
    init() {
        // 创建音频上下文
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        
        // 从localStorage读取静音状态
        const savedMute = localStorage.getItem('antiFraudGameMuted');
        if (savedMute !== null) {
            this.muted = savedMute === 'true';
            this.updateButton();
        }
    },

    /**
     * 播放音效 - 按钮点击
     */
    playClick() {
        if (this.muted || !this.ctx) return;
        this.playTone(800, 0.05, 0.1, 'sine');
    },

    /**
     * 播放音效 - 成功/通关
     */
    playSuccess() {
        if (this.muted || !this.ctx) return;
        // 播放成功和弦
        this.playTone(523.25, 0.1, 0.3, 'sine'); // C5
        setTimeout(() => this.playTone(659.25, 0.1, 0.3, 'sine'), 100); // E5
        setTimeout(() => this.playTone(783.99, 0.1, 0.3, 'sine'), 200); // G5
    },

    /**
     * 播放音效 - 失败
     */
    playFail() {
        if (this.muted || !this.ctx) return;
        // 播放失败音效
        this.playTone(200, 0.1, 0.3, 'sawtooth');
        setTimeout(() => this.playTone(150, 0.2, 0.3, 'sawtooth'), 150);
    },

    /**
     * 播放音效 - 收集道具
     */
    playCollect() {
        if (this.muted || !this.ctx) return;
        this.playTone(880, 0.05, 0.15, 'sine');
        setTimeout(() => this.playTone(1174.66, 0.05, 0.15, 'sine'), 50);
    },

    /**
     * 播放音效 - 碰撞/危险
     */
    playHit() {
        if (this.muted || !this.ctx) return;
        this.playTone(150, 0.1, 0.3, 'square');
    },

    /**
     * 播放单个音符
     * @param {number} frequency - 频率(Hz)
     * @param {number} attack -  Attack时间(秒)
     * @param {number} duration - 持续时间(秒)
     * @param {string} type - 波形类型
     * @param {number} volume - 音量(0-1)
     */
    playTone(frequency, attack, duration, type = 'sine', volume = 0.3) {
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.frequency.value = frequency;
        osc.type = type;

        // 设置音量包络
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + attack);
        gain.gain.exponentialRampToValueAtTime(0.001, now + attack + duration);

        osc.start(now);
        osc.stop(now + attack + duration + 0.05);
    },

    /**
     * 开始播放背景音乐
     * 轻快、放松、治愈风格的旋律
     */
    startBGM() {
        if (this.muted || !this.ctx) return;
        this.stopBGM();

        // 治愈系BGM音符序列 - 采用五声音阶，营造轻松愉悦的氛围
        // C大调五声音阶：C - D - E - G - A
        const melody = [
            // 第一段：轻柔引入
            {f: 523.25, d: 0.6, t: 'sine', v: 0.15},   // C5
            {f: 587.33, d: 0.6, t: 'sine', v: 0.15},   // D5
            {f: 659.25, d: 0.8, t: 'sine', v: 0.15},   // E5
            {f: 0, d: 0.4, t: 'sine', v: 0},           // 休止
            {f: 659.25, d: 0.6, t: 'sine', v: 0.15},   // E5
            {f: 587.33, d: 0.6, t: 'sine', v: 0.15},   // D5
            {f: 523.25, d: 0.8, t: 'sine', v: 0.15},   // C5
            {f: 0, d: 0.4, t: 'sine', v: 0},           // 休止

            // 第二段：旋律上扬
            {f: 523.25, d: 0.5, t: 'sine', v: 0.15},   // C5
            {f: 659.25, d: 0.5, t: 'sine', v: 0.15},   // E5
            {f: 783.99, d: 0.6, t: 'sine', v: 0.15},   // G5
            {f: 880.00, d: 0.6, t: 'sine', v: 0.15},   // A5
            {f: 783.99, d: 0.8, t: 'sine', v: 0.15},   // G5
            {f: 0, d: 0.3, t: 'sine', v: 0},           // 休止

            // 第三段：舒缓下行
            {f: 880.00, d: 0.5, t: 'sine', v: 0.15},   // A5
            {f: 783.99, d: 0.5, t: 'sine', v: 0.15},   // G5
            {f: 659.25, d: 0.6, t: 'sine', v: 0.15},   // E5
            {f: 587.33, d: 0.6, t: 'sine', v: 0.15},   // D5
            {f: 523.25, d: 1.0, t: 'sine', v: 0.15},   // C5（长音）
            {f: 0, d: 0.5, t: 'sine', v: 0},           // 休止

            // 第四段：重复变奏
            {f: 659.25, d: 0.5, t: 'sine', v: 0.15},   // E5
            {f: 659.25, d: 0.5, t: 'sine', v: 0.15},   // E5
            {f: 587.33, d: 0.5, t: 'sine', v: 0.15},   // D5
            {f: 587.33, d: 0.5, t: 'sine', v: 0.15},   // D5
            {f: 523.25, d: 0.8, t: 'sine', v: 0.15},   // C5
            {f: 0, d: 0.3, t: 'sine', v: 0},           // 休止

            // 结尾：渐弱收尾
            {f: 523.25, d: 0.4, t: 'sine', v: 0.12},   // C5
            {f: 587.33, d: 0.4, t: 'sine', v: 0.10},   // D5
            {f: 523.25, d: 1.2, t: 'sine', v: 0.08},   // C5（渐弱长音）
            {f: 0, d: 0.8, t: 'sine', v: 0}            // 休止
        ];

        const playNextNote = () => {
            if (this.muted) return;

            const note = melody[this.bgmNoteIndex % melody.length];

            // 播放音符（如果是休止符则不播放）
            if (note.f > 0) {
                this.playTone(note.f, 0.08, note.d - 0.08, note.t, note.v);
            }

            this.bgmNoteIndex++;
            this.bgmTimer = setTimeout(playNextNote, note.d * 1000);
        };

        playNextNote();
    },

    /**
     * 停止背景音乐
     */
    stopBGM() {
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
        this.bgmNoteIndex = 0;
    },

    /**
     * 切换静音状态
     */
    toggle() {
        this.muted = !this.muted;
        localStorage.setItem('antiFraudGameMuted', this.muted);
        this.updateButton();
        
        if (this.muted) {
            this.stopBGM();
        } else {
            // 恢复音频上下文（浏览器策略）
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            this.startBGM();
        }
    },

    /**
     * 更新音乐按钮显示
     */
    updateButton() {
        const btn = document.getElementById('music-toggle');
        if (btn) {
            btn.textContent = this.muted ? '🔇' : '🔊';
            btn.classList.toggle('muted', this.muted);
        }
    }
};

// ========================================
// 游戏配置与数据
// ========================================
const GAME_CONFIG = {
    // 关卡1配置：陷阱躲避 - 三种难度
    level1: {
        easy: {
            duration: 30,           // 游戏时长（秒）
            trapSpeed: 4,           // 陷阱下落速度（秒）- 越慢越简单
            spawnInterval: 2000,    // 生成间隔（毫秒）- 越大越简单
            playerSpeed: 15,        // 玩家移动速度（像素）
            winScore: 100,          // 通关所需分数
            label: '简单'
        },
        medium: {
            duration: 45,
            trapSpeed: 3,
            spawnInterval: 1500,
            playerSpeed: 15,
            winScore: 150,
            label: '中等'
        },
        hard: {
            duration: 60,
            trapSpeed: 2,
            spawnInterval: 1000,
            playerSpeed: 12,        // 困难模式移动速度稍慢
            winScore: 200,
            label: '困难'
        }
    },
    // 关卡2配置：剧情抉择
    level2: {
        totalScenes: 5          // 总场景数
    },
    // 关卡3配置：线索找茬
    level3: {
        totalClues: 7           // 总线索数（更新为7个）
    }
};

// 关卡1陷阱类型及详细危害说明
const TRAP_DANGERS = {
    '刷单返利': {
        title: '⚠️ 刷单返利陷阱',
        danger: '刷单是违法行为，且100%是诈骗！',
        details: [
            '骗子以"高额返利"为诱饵，让你先垫付小额资金',
            '前期可能返还小额佣金，获取你的信任',
            '后期要求垫付大额资金，然后卷款跑路',
            '不仅损失钱财，还可能涉及违法'
        ],
        advice: '牢记：所有刷单都是诈骗！不存在无成本高返利！'
    },
    '高佣金': {
        title: '⚠️ 高佣金陷阱',
        danger: '高佣金只是诱饵，目的是让你垫钱！',
        details: [
            '宣称"日赚500""月入过万"，远超正常兼职收入',
            '要求先缴纳"保证金""会员费"',
            '或要求先垫付货款，承诺完成后返还',
            '一旦转账，钱被骗走，任务永远不会完成'
        ],
        advice: '警惕：轻松赚钱的背后往往是骗局！'
    },
    '轻松赚钱': {
        title: '⚠️ 轻松赚钱陷阱',
        danger: '天上不会掉馅饼，轻松赚钱是骗局！',
        details: [
            '利用人们想轻松赚钱的心理设下陷阱',
            '要求提供个人信息、银行卡号',
            '可能涉及洗钱等违法犯罪活动',
            '最终不仅赚不到钱，还会损失本金'
        ],
        advice: '谨记：正规兼职不会要求先交钱！'
    },
    '垫付立返': {
        title: '⚠️ 垫付立返陷阱',
        danger: '任何要求先垫付的都是诈骗！',
        details: [
            '骗子声称"垫付100返120"，诱惑你转账',
            '小额垫付后会要求大额垫付',
            '当你要求返还时，对方会以各种理由拒绝',
            '最终垫付的钱全部被骗走'
        ],
        advice: '铁律：先垫钱的兼职100%是诈骗！'
    },
    '日赚500': {
        title: '⚠️ 日赚500陷阱',
        danger: '虚假承诺高收入，只为骗你入套！',
        details: [
            '日赚500月入过万，远超正常收入水平',
            '要求下载不明APP或点击可疑链接',
            '可能涉及传销、赌博等违法活动',
            '投入的钱有去无回，还可能泄露个人信息'
        ],
        advice: '提醒：高收入承诺往往是骗局的开始！'
    }
};

// 关卡1反诈知识提示
const LEVEL1_TIPS = [
    "刷单都是诈骗，没有无成本高返利！",
    "先垫付后返利的都是骗局！",
    "高额佣金往往是诈骗诱饵！",
    "刷单违法，切勿参与！",
    "正规兼职不会要求先交钱！",
    "网络刷单100%是诈骗！",
    "警惕'轻松赚钱'的陷阱！",
    "任何垫付要求都是诈骗！"
];

// 关卡2剧情数据
const LEVEL2_STORY = [
    {
        npc: "嗨，在吗？我是通过交友平台看到你的资料的。",
        choices: [
            { text: "你好，请问有什么事？", correct: true },
            { text: "直接发红包表示诚意", correct: false }
        ],
        wrongTip: "刚认识就发红包？这可能是诈骗分子的套路！"
    },
    {
        npc: "我觉得你很有趣，可以认识一下吗？我在国外做金融投资。",
        choices: [
            { text: "可以聊聊，但我不投资", correct: true },
            { text: "听起来很厉害，带带我", correct: false }
        ],
        wrongTip: "网恋对象推荐投资？这是典型的'杀猪盘'诈骗！"
    },
    {
        npc: "我们聊得这么投机，你有考虑过我们的未来吗？",
        choices: [
            { text: "先见面了解再说", correct: true },
            { text: "我相信你，听你的安排", correct: false }
        ],
        wrongTip: "网恋未见面就谈未来？保持理性，谨防被骗！"
    },
    {
        npc: "我这边有个紧急情况，需要2万元周转，你能帮我吗？",
        choices: [
            { text: "抱歉，我们还没见过面", correct: true },
            { text: "好，我马上转给你", correct: false }
        ],
        wrongTip: "网恋对象借钱？99%是诈骗！务必核实身份！"
    },
    {
        npc: "你不帮我就是不爱我，我对你太失望了！",
        choices: [
            { text: "感情不该用金钱衡量", correct: true },
            { text: "别生气，我这就转", correct: false }
        ],
        wrongTip: "用感情威胁转账？这是情感操控，坚决拒绝！"
    }
];

// 关卡3线索解释
const LEVEL3_CLUES = [
    {
        title: "⚠️ 要求先垫付",
        explain: "正规退款不会要求先缴纳保证金或垫付资金，这是诈骗的典型特征！"
    },
    {
        title: "⚠️ 索要银行卡号和验证码",
        explain: "正规客服绝不会索要银行卡号、验证码等敏感信息，这是盗取账户的常见手段！"
    },
    {
        title: "⚠️ 要求转账到私人账户",
        explain: "正规退款原路返回，不会要求转账到私人银行账户！"
    },
    {
        title: "⚠️ 可疑链接",
        explain: "非官方域名的链接可能是钓鱼网站，会窃取你的账户信息！"
    },
    {
        title: "⚠️ 制造紧迫感",
        explain: "诈骗分子常用'限时''通道关闭'等话术制造紧迫感，让你来不及思考！"
    },
    {
        title: "⚠️ 声称内部特殊通道",
        explain: "正规退款没有'内部通道'，要求绕过官方渠道的都是诈骗！"
    },
    {
        title: "⚠️ 要求私下加微信",
        explain: "正规客服不会要求加微信私聊，脱离平台监管的都是诈骗！"
    }
];

// ========================================
// 游戏主控制器
// ========================================
const game = {
    // 游戏状态
    state: {
        currentLevel: 0,        // 当前关卡（0表示未开始）
        unlockedLevels: [1],    // 已解锁关卡
        completedLevels: [],    // 已完成关卡
        totalScore: 0,          // 总得分
        levelScores: {}         // 各关卡得分
    },

    /**
     * 初始化游戏
     * 从localStorage读取保存的游戏进度
     */
    init() {
        this.loadState();
        this.updateHomeProgress();
        
        // 初始化音频（需要用户交互后才能播放）
        document.addEventListener('click', () => {
            if (!audioManager.ctx) {
                audioManager.init();
                audioManager.startBGM();
            } else if (audioManager.ctx.state === 'suspended') {
                audioManager.ctx.resume();
                audioManager.startBGM();
            }
        }, { once: true });
    },

    /**
     * 从localStorage加载游戏状态
     */
    loadState() {
        const saved = localStorage.getItem('antiFraudGameState');
        if (saved) {
            this.state = JSON.parse(saved);
        }
    },

    /**
     * 保存游戏状态到localStorage
     */
    saveState() {
        localStorage.setItem('antiFraudGameState', JSON.stringify(this.state));
    },

    /**
     * 更新首页进度显示
     */
    updateHomeProgress() {
        const progressEl = document.getElementById('progress-info');
        const completed = this.state.completedLevels.length;
        if (completed > 0) {
            progressEl.innerHTML = `已完成 ${completed}/3 关 | 总得分: ${this.state.totalScore}`;
        }
    },

    /**
     * 显示首页
     */
    showHome() {
        this.hideAllPages();
        document.getElementById('home-page').classList.add('active');
        this.updateHomeProgress();
    },

    /**
     * 显示关卡选择页
     */
    showLevelSelect() {
        this.hideAllPages();
        document.getElementById('level-select-page').classList.add('active');
        this.updateLevelSelectUI();
    },

    /**
     * 更新关卡选择页UI状态
     */
    updateLevelSelectUI() {
        for (let i = 1; i <= 3; i++) {
            const el = document.getElementById(`level-${i}`);
            el.classList.remove('locked', 'completed');
            
            if (this.state.completedLevels.includes(i)) {
                el.classList.add('completed');
            } else if (!this.state.unlockedLevels.includes(i)) {
                el.classList.add('locked');
            }
        }
    },

    /**
     * 隐藏所有页面
     */
    hideAllPages() {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
    },

    /**
     * 开始指定关卡
     * @param {number} level - 关卡编号
     */
    startLevel(level) {
        // 检查关卡是否解锁
        if (!this.state.unlockedLevels.includes(level)) {
            return;
        }

        this.state.currentLevel = level;
        this.hideAllPages();

        // 根据关卡启动对应游戏
        switch(level) {
            case 1:
                // 先显示难度选择页面
                document.getElementById('level1-select-page').classList.add('active');
                break;
            case 2:
                document.getElementById('level2-page').classList.add('active');
                level2.init();
                break;
            case 3:
                document.getElementById('level3-page').classList.add('active');
                level3.init();
                break;
        }
    },

    /**
     * 完成关卡
     * @param {number} level - 关卡编号
     * @param {number} score - 关卡得分
     * @param {boolean} success - 是否成功通关
     */
    completeLevel(level, score, success) {
        if (success) {
            // 记录得分
            this.state.levelScores[level] = score;
            this.state.totalScore = Object.values(this.state.levelScores)
                .reduce((a, b) => a + b, 0);

            // 标记完成
            if (!this.state.completedLevels.includes(level)) {
                this.state.completedLevels.push(level);
            }

            // 解锁下一关
            const nextLevel = level + 1;
            if (nextLevel <= 3 && !this.state.unlockedLevels.includes(nextLevel)) {
                this.state.unlockedLevels.push(nextLevel);
            }

            this.saveState();

            // 检查是否全部通关
            if (this.state.completedLevels.length === 3) {
                setTimeout(() => this.showCompletePage(), 500);
            }
        }
    },

    /**
     * 显示通关页面
     */
    showCompletePage() {
        this.hideAllPages();
        document.getElementById('complete-page').classList.add('active');
        document.getElementById('final-score').textContent = this.state.totalScore;
    },

    /**
     * 重置游戏
     */
    resetGame() {
        this.state = {
            currentLevel: 0,
            unlockedLevels: [1],
            completedLevels: [],
            totalScore: 0,
            levelScores: {}
        };
        this.saveState();
        this.showHome();
    },

    /**
     * 显示结算弹窗
     * @param {Object} options - 弹窗配置
     */
    showResultModal(options) {
        const container = document.getElementById('modal-container');
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div class="overlay" onclick="game.closeModal()"></div>
            <div class="result-modal">
                <div class="icon">${options.icon}</div>
                <h3>${options.title}</h3>
                ${options.score !== undefined ? `<div class="score-display">${options.score}分</div>` : ''}
                ${options.knowledge ? `
                    <div class="knowledge-card">
                        <h4>${options.knowledge.title}</h4>
                        <ul>${options.knowledge.items.map(item => `<li>${item}</li>`).join('')}</ul>
                    </div>
                ` : ''}
                <div class="btn-group">
                    ${options.showNext ? `<button class="btn-next" onclick="${options.onNext}">下一关 →</button>` : ''}
                    ${options.showRetry ? `<button class="btn-retry" onclick="${options.onRetry}">重新挑战</button>` : ''}
                    <button class="btn-retry" onclick="game.closeModal(); game.showLevelSelect();">返回关卡</button>
                </div>
            </div>
        `;
        container.appendChild(modal);
    },

    /**
     * 关闭弹窗
     */
    closeModal() {
        document.getElementById('modal-container').innerHTML = '';
    }
};

// ========================================
// 关卡1：陷阱躲避游戏
// ========================================
const level1 = {
    // 游戏状态
    score: 0,
    timeLeft: 0,
    isPlaying: false,
    playerX: 50,            // 玩家位置（百分比）
    gameLoop: null,
    spawnTimer: null,
    countdownTimer: null,
    traps: [],
    items: [],
    tipIndex: 0,
    currentDifficulty: 'easy',  // 当前难度
    config: null,               // 当前难度配置

    /**
     * 选择难度并开始游戏
     * @param {string} difficulty - 难度等级：easy/medium/hard
     */
    startWithDifficulty(difficulty) {
        audioManager.playClick();
        this.currentDifficulty = difficulty;
        this.config = GAME_CONFIG.level1[difficulty];

        // 隐藏难度选择页面，显示游戏页面
        document.getElementById('level1-select-page').classList.remove('active');
        document.getElementById('level1-page').classList.add('active');

        // 更新难度标签
        const labelEl = document.getElementById('level1-difficulty-label');
        labelEl.textContent = this.config.label;
        labelEl.className = 'difficulty-label ' + difficulty;

        // 初始化游戏
        this.init();
    },

    /**
     * 初始化关卡
     */
    init() {
        this.reset();
        this.start();
    },

    /**
     * 重置游戏状态
     */
    reset() {
        this.score = 0;
        this.timeLeft = this.config.duration;
        this.isPlaying = true;
        this.playerX = 50;
        this.traps = [];
        this.items = [];
        this.tipIndex = 0;

        // 更新UI
        document.getElementById('level1-score').textContent = '0';
        document.getElementById('level1-progress').style.width = '0%';
        document.getElementById('player').style.left = '50%';

        // 清除旧元素
        document.querySelectorAll('.trap, .item, .tip-popup').forEach(el => el.remove());
    },

    /**
     * 开始游戏
     */
    start() {
        // 键盘控制
        this.setupControls();

        // 开始生成陷阱和道具（使用当前难度的配置）
        this.spawnTimer = setInterval(() => this.spawnObjects(), this.config.spawnInterval);

        // 开始倒计时
        this.countdownTimer = setInterval(() => {
            this.timeLeft--;
            const progress = ((this.config.duration - this.timeLeft) / this.config.duration) * 100;
            document.getElementById('level1-progress').style.width = progress + '%';

            if (this.timeLeft <= 0) {
                this.end(true);
            }
        }, 1000);

        // 开始游戏循环
        this.gameLoop = requestAnimationFrame(() => this.update());
    },

    /**
     * 设置控制方式
     */
    setupControls() {
        // 键盘控制
        document.onkeydown = (e) => {
            if (!this.isPlaying) return;
            if (e.key === 'ArrowLeft') this.moveLeft();
            if (e.key === 'ArrowRight') this.moveRight();
        };

        // 触摸滑动控制
        let touchStartX = 0;
        const gameArea = document.getElementById('game-area-level1');
        
        gameArea.ontouchstart = (e) => {
            touchStartX = e.touches[0].clientX;
        };

        gameArea.ontouchmove = (e) => {
            if (!this.isPlaying) return;
            e.preventDefault();
            const touchX = e.touches[0].clientX;
            const rect = gameArea.getBoundingClientRect();
            const percent = ((touchX - rect.left) / rect.width) * 100;
            this.playerX = Math.max(5, Math.min(95, percent));
            document.getElementById('player').style.left = this.playerX + '%';
        };
    },

    /**
     * 向左移动
     */
    moveLeft() {
        if (!this.isPlaying) return;
        this.playerX = Math.max(5, this.playerX - this.config.playerSpeed);
        document.getElementById('player').style.left = this.playerX + '%';
    },

    /**
     * 向右移动
     */
    moveRight() {
        if (!this.isPlaying) return;
        this.playerX = Math.min(95, this.playerX + this.config.playerSpeed);
        document.getElementById('player').style.left = this.playerX + '%';
    },

    /**
     * 生成陷阱和道具
     */
    spawnObjects() {
        if (!this.isPlaying) return;

        const gameArea = document.getElementById('game-area-level1');
        const isTrap = Math.random() > 0.3;  // 70%概率生成陷阱

        if (isTrap) {
            // 生成陷阱
            const trapTexts = ['刷单返利', '高佣金', '轻松赚钱', '垫付立返', '日赚500'];
            const trapText = trapTexts[Math.floor(Math.random() * trapTexts.length)];
            const trap = document.createElement('div');
            trap.className = 'trap';
            trap.textContent = trapText;
            trap.dataset.trapType = trapText;  // 记录陷阱类型
            trap.style.left = Math.random() * 80 + 10 + '%';
            trap.style.animationDuration = this.config.trapSpeed + 's';
            gameArea.appendChild(trap);
            this.traps.push(trap);

            // 自动清理
            setTimeout(() => {
                if (trap.parentNode) {
                    trap.remove();
                    this.traps = this.traps.filter(t => t !== trap);
                    // 成功躲避加分
                    this.addScore(10);
                    // 显示知识点
                    this.showTip();
                }
            }, this.config.trapSpeed * 1000);
        } else {
            // 生成道具
            const item = document.createElement('div');
            item.className = 'item';
            item.textContent = '🛡️';
            item.style.left = Math.random() * 80 + 10 + '%';
            item.style.animationDuration = (this.config.trapSpeed + 1) + 's';
            gameArea.appendChild(item);
            this.items.push(item);

            setTimeout(() => {
                if (item.parentNode) {
                    item.remove();
                    this.items = this.items.filter(i => i !== item);
                }
            }, (this.config.trapSpeed + 1) * 1000);
        }
    },

    /**
     * 显示知识点提示
     */
    showTip() {
        const tip = LEVEL1_TIPS[this.tipIndex % LEVEL1_TIPS.length];
        this.tipIndex++;

        const popup = document.createElement('div');
        popup.className = 'tip-popup';
        popup.textContent = '💡 ' + tip;
        document.getElementById('level1-page').appendChild(popup);

        setTimeout(() => popup.remove(), 4000);
    },

    /**
     * 增加分数
     */
    addScore(points) {
        this.score += points;
        document.getElementById('level1-score').textContent = this.score;
    },

    /**
     * 播放收集音效
     */
    playCollectSound() {
        audioManager.playCollect();
    },

    /**
     * 游戏主循环 - 碰撞检测
     */
    update() {
        if (!this.isPlaying) return;

        const player = document.getElementById('player');
        const playerRect = player.getBoundingClientRect();

        // 检测陷阱碰撞
        for (let i = 0; i < this.traps.length; i++) {
            const trap = this.traps[i];
            if (this.checkCollision(playerRect, trap.getBoundingClientRect())) {
                audioManager.playHit(); // 播放碰撞音效
                const trapType = trap.dataset.trapType;
                this.showDangerModal(trapType);
                return; // 碰撞后停止游戏循环
            }
        }

        // 检测道具收集
        this.items.forEach(item => {
            if (item.parentNode && this.checkCollision(playerRect, item.getBoundingClientRect())) {
                this.addScore(50);
                this.playCollectSound(); // 播放收集音效
                item.remove();
                this.items = this.items.filter(i => i !== item);
            }
        });

        this.gameLoop = requestAnimationFrame(() => this.update());
    },

    /**
     * 碰撞检测
     */
    checkCollision(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
    },

    /**
     * 显示危害说明弹窗
     * @param {string} trapType - 陷阱类型
     */
    showDangerModal(trapType) {
        // 停止游戏
        this.isPlaying = false;
        clearInterval(this.spawnTimer);
        clearInterval(this.countdownTimer);
        cancelAnimationFrame(this.gameLoop);
        document.onkeydown = null;

        // 获取危害说明
        const danger = TRAP_DANGERS[trapType] || TRAP_DANGERS['刷单返利'];

        // 显示弹窗
        const container = document.getElementById('modal-container');
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div class="overlay"></div>
            <div class="danger-modal">
                <div class="warning-icon">⚠️</div>
                <h3>你触碰了诈骗陷阱！</h3>
                <div class="trap-type">${trapType}</div>
                <div class="danger-content">
                    <h4>${danger.title}</h4>
                    <p style="color: #ff4757; font-weight: bold; margin-bottom: 15px;">${danger.danger}</p>
                    <p style="margin-bottom: 10px;">诈骗套路：</p>
                    <ul>
                        ${danger.details.map(d => `<li>${d}</li>`).join('')}
                    </ul>
                    <p style="color: #52c41a; font-weight: bold; margin-top: 15px; padding: 10px; background: #f6ffed; border-radius: 8px;">
                        💡 ${danger.advice}
                    </p>
                </div>
                <div class="btn-group">
                    <button class="btn-retry" onclick="game.closeModal(); level1.init()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">重新挑战</button>
                    <button class="btn-retry" onclick="game.closeModal(); game.showLevelSelect()">返回关卡</button>
                </div>
            </div>
        `;
        container.appendChild(modal);
    },

    /**
     * 游戏结束
     * @param {boolean} success - 是否成功
     */
    end(success) {
        this.isPlaying = false;
        clearInterval(this.spawnTimer);
        clearInterval(this.countdownTimer);
        cancelAnimationFrame(this.gameLoop);
        document.onkeydown = null;

        // 清除所有元素
        document.querySelectorAll('.trap, .item, .tip-popup').forEach(el => el.remove());

        if (success) {
            audioManager.playSuccess(); // 播放通关音效
            game.completeLevel(1, this.score, true);
            game.showResultModal({
                icon: '🎉',
                title: '关卡完成！',
                score: this.score,
                knowledge: {
                    title: '📚 刷单诈骗防范要点',
                    items: [
                        '所有刷单都是诈骗，没有例外',
                        '先垫付后返利的都是骗局',
                        '高额佣金是诱饵，切勿相信',
                        '刷单本身就是违法行为'
                    ]
                },
                showNext: true,
                onNext: 'game.closeModal(); game.startLevel(2)',
                showRetry: true,
                onRetry: 'game.closeModal(); level1.init()'
            });
        } else {
            audioManager.playFail(); // 播放失败音效
            game.showResultModal({
                icon: '💥',
                title: '游戏结束',
                score: this.score,
                showNext: false,
                showRetry: true,
                onRetry: 'game.closeModal(); level1.init()'
            });
        }
    }
};

// ========================================
// 关卡2：聊天剧情抉择
// ========================================
const level2 = {
    currentScene: 0,
    correctCount: 0,

    /**
     * 初始化关卡
     */
    init() {
        this.currentScene = 0;
        this.correctCount = 0;
        document.getElementById('chat-container').innerHTML = '';
        this.showScene();
    },

    /**
     * 显示当前场景
     */
    showScene() {
        if (this.currentScene >= LEVEL2_STORY.length) {
            this.end();
            return;
        }

        const scene = LEVEL2_STORY[this.currentScene];
        
        // 添加NPC消息
        this.addMessage('other', '👤', scene.npc);

        // 更新进度
        document.getElementById('level2-progress-text').textContent = 
            `${this.currentScene + 1}/${LEVEL2_STORY.length}`;

        // 显示选项
        this.showChoices(scene.choices, scene.wrongTip);
    },

    /**
     * 添加聊天消息
     */
    addMessage(type, avatar, text) {
        const container = document.getElementById('chat-container');
        const msg = document.createElement('div');
        msg.className = `chat-message ${type}`;
        msg.innerHTML = `
            <div class="avatar">${avatar}</div>
            <div class="message-bubble">${text}</div>
        `;
        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
    },

    /**
     * 显示选项按钮
     */
    showChoices(choices, wrongTip) {
        const container = document.getElementById('choices-container');
        container.innerHTML = '<h4>请选择你的回复：</h4>';

        choices.forEach((choice, index) => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = choice.text;
            btn.onclick = () => this.makeChoice(choice, wrongTip, btn);
            container.appendChild(btn);
        });
    },

    /**
     * 做出选择
     */
    makeChoice(choice, wrongTip, btn) {
        // 播放点击音效
        audioManager.playClick();
        
        // 禁用所有按钮
        document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);

        // 标记选择结果
        if (choice.correct) {
            btn.classList.add('correct');
            this.correctCount++;
            this.addMessage('self', '🛡️', choice.text);
        } else {
            btn.classList.add('wrong');
            this.addMessage('self', '🛡️', choice.text);
            
            // 显示错误提示
            setTimeout(() => {
                this.addMessage('other', '⚠️', wrongTip);
            }, 500);
        }

        // 进入下一幕
        setTimeout(() => {
            this.currentScene++;
            this.showScene();
        }, 1500);
    },

    /**
     * 关卡结束
     */
    end() {
        const score = this.correctCount * 100;
        const success = this.correctCount >= 3;

        game.completeLevel(2, score, success);

        if (success) {
            audioManager.playSuccess(); // 播放通关音效
            game.showResultModal({
                icon: '💖',
                title: '剧情通关！',
                score: score,
                knowledge: {
                    title: '📚 网恋诈骗防范要点',
                    items: [
                        '网络交友需谨慎，不要轻信陌生人',
                        '涉及金钱往来务必核实身份',
                        '警惕"杀猪盘"式情感诈骗',
                        '未见面之前不要有大额转账'
                    ]
                },
                showNext: true,
                onNext: 'game.closeModal(); game.startLevel(3)',
                showRetry: true,
                onRetry: 'game.closeModal(); level2.init()'
            });
        } else {
            audioManager.playFail(); // 播放失败音效
            game.showResultModal({
                icon: '💔',
                title: '需要提高警惕',
                score: score,
                knowledge: {
                    title: '⚠️ 你陷入了诈骗陷阱',
                    items: [
                        '网恋对象借钱99%是诈骗',
                        '不要被感情冲昏头脑',
                        '涉及转账务必多方核实',
                        '建议重新学习反诈知识'
                    ]
                },
                showNext: false,
                showRetry: true,
                onRetry: 'game.closeModal(); level2.init()'
            });
        }
    }
};

// ========================================
// 关卡3：线索找茬
// ========================================
const level3 = {
    foundClues: [],
    startTime: null,
    timerInterval: null,
    wrongClicks: 0,
    timePenalty: 0,  // 时间惩罚（秒）

    /**
     * 初始化关卡
     */
    init() {
        this.foundClues = [];
        this.wrongClicks = 0;
        this.timePenalty = 0;
        document.getElementById('level3-found').textContent = '0';
        document.getElementById('level3-timer').textContent = '00:00';

        // 重置所有线索状态
        document.querySelectorAll('.clue').forEach(el => {
            el.classList.remove('found');
            const marker = el.querySelector('.clue-marker');
            if (marker) marker.remove();
        });

        // 开始计时
        this.startTimer();
    },

    /**
     * 开始计时
     */
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000) + this.timePenalty;
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            document.getElementById('level3-timer').textContent = `${minutes}:${seconds}`;
        }, 1000);
    },

    /**
     * 停止计时
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    /**
     * 显示时间惩罚提示
     */
    showTimePenalty() {
        const penalty = document.createElement('div');
        penalty.className = 'time-penalty';
        penalty.textContent = '❌ 错误点击！时间 +5秒';
        document.body.appendChild(penalty);
        setTimeout(() => penalty.remove(), 1500);
    },

    /**
     * 处理普通段落点击（错误点击）
     * @param {HTMLElement} element - 被点击的段落元素
     * @param {number} id - 段落ID（-1表示普通文字）
     */
    handleParagraphClick(element, id) {
        // 如果已经点击过，不再处理
        if (element.classList.contains('wrong-click')) return;

        // 如果游戏已结束，不处理
        if (this.foundClues.length >= 5) return;

        // 标记为已点击
        element.classList.add('wrong-click');

        // 错误点击惩罚
        this.wrongClicks++;
        this.timePenalty += 5;

        // 显示惩罚提示
        this.showTimePenalty();

        // 播放错误音效
        audioManager.playFail();
    },

    /**
     * 找到线索
     * @param {number} clueId - 线索ID
     */
    findClue(clueId) {
        // 检查是否已找到
        if (this.foundClues.includes(clueId)) return;

        // 播放点击音效
        audioManager.playClick();

        // 标记为已找到
        this.foundClues.push(clueId);
        const clueEl = document.querySelector(`[data-clue="${clueId}"]`);
        clueEl.classList.add('found');

        // 添加标记
        const marker = document.createElement('span');
        marker.className = 'clue-marker';
        marker.textContent = this.foundClues.length;
        clueEl.appendChild(marker);

        // 更新计数
        document.getElementById('level3-found').textContent = this.foundClues.length;

        // 显示解释弹窗
        this.showClueExplanation(clueId);

        // 检查是否全部找到
        if (this.foundClues.length === GAME_CONFIG.level3.totalClues) {
            setTimeout(() => this.end(), 1000);
        }
    },

    /**
     * 显示线索解释
     */
    showClueExplanation(clueId) {
        const clue = LEVEL3_CLUES[clueId];
        const container = document.getElementById('modal-container');
        
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div class="overlay"></div>
            <div class="clue-explanation">
                <h4>${clue.title}</h4>
                <p>${clue.explain}</p>
                <button onclick="game.closeModal()">知道了</button>
            </div>
        `;
        container.appendChild(modal);
    },

    /**
     * 关卡结束
     */
    end() {
        // 停止计时
        this.stopTimer();

        // 计算最终用时
        const totalTime = Math.floor((Date.now() - this.startTime) / 1000) + this.timePenalty;
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        const timeStr = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;

        // 计算得分（基础分500 - 时间惩罚 - 错误点击惩罚）
        let score = 500 - (totalTime * 2) - (this.wrongClicks * 20);
        score = Math.max(100, score); // 最低100分

        game.completeLevel(3, score, true);

        audioManager.playSuccess(); // 播放通关音效

        // 构建成绩信息
        let performanceText = '';
        if (this.wrongClicks === 0 && totalTime < 60) {
            performanceText = '🏆 完美！火眼金睛！';
        } else if (this.wrongClicks <= 2) {
            performanceText = '👍 不错！观察力很强！';
        } else {
            performanceText = '💪 完成了！继续加油！';
        }

        const container = document.getElementById('modal-container');
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div class="overlay" onclick="game.closeModal()"></div>
            <div class="result-modal">
                <div class="icon">🔍</div>
                <h3>全部找出！</h3>
                <div style="background: #f5f7fa; padding: 15px; border-radius: 15px; margin-bottom: 20px; text-align: left;">
                    <p style="margin-bottom: 8px;"><strong>⏱️ 用时：</strong>${timeStr}</p>
                    <p style="margin-bottom: 8px;"><strong>❌ 错误点击：</strong>${this.wrongClicks}次</p>
                    <p style="margin-bottom: 8px; color: #ff4757;"><strong>⏳ 时间惩罚：</strong>+${this.timePenalty}秒</p>
                    <p style="font-size: 18px; color: #667eea; font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
                        🎯 最终得分：${score}分
                    </p>
                </div>
                <p style="color: #52c41a; font-weight: bold; margin-bottom: 20px;">${performanceText}</p>
                <div class="knowledge-card">
                    <h4>📚 冒充客服诈骗防范口诀</h4>
                    <ul>
                        <li>退款无需先垫付，要求转账是骗子</li>
                        <li>客服不会要密码，索要验证码是骗子</li>
                        <li>陌生链接不要点，钓鱼网站要警惕</li>
                        <li>遇到问题找官方，不要私下加微信</li>
                    </ul>
                </div>
                <div class="btn-group">
                    <button class="btn-retry" onclick="game.closeModal(); level3.init()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">再玩一次</button>
                    <button class="btn-retry" onclick="game.closeModal(); game.showLevelSelect()">返回关卡</button>
                </div>
            </div>
        `;
        container.appendChild(modal);
    }
};

// ========================================
// 页面加载完成后初始化游戏
// ========================================
window.onload = () => {
    game.init();
};
