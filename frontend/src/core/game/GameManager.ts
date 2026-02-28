import { GameConfig, GameState, LevelConfig, GameResult } from './types';
import { eventBus } from './EventBus';
import ScoreSystem from './ScoreSystem';

/**
 * 游戏模块接口
 * 所有具体游戏模块都需要实现此接口
 */
export interface GameModule {
    init(config: GameConfig): void;
    start(): void;
    pause(): void;
    resume(): void;
    stop(): void;
    destroy(): void;
}

/**
 * 游戏管理器
 * 负责管理游戏生命周期、关卡加载、得分等核心逻辑
 */
class GameManager {
    private config: GameConfig;
    private state: GameState = GameState.IDLE;
    private currentLevel: LevelConfig | null = null;
    private currentModule: GameModule | null = null;
    private scoreSystem: ScoreSystem;
    private gameLoopId: number | null = null;
    private questionIndex = 0;

    constructor(config: GameConfig) {
        this.config = config;
        this.scoreSystem = new ScoreSystem({
            baseScore: 10,
            bonusPerSecond: 0.1,
            penaltyPerWrong: 5,
            maxScore: 100,
        });
    }

    /**
     * 初始化游戏
     */
    init(config?: Partial<GameConfig>): void {
        if (config) {
            this.config = { ...this.config, ...config };
        }
        this.state = GameState.READY;
        eventBus.emit('game:ready', { config: this.config });
    }

    /**
     * 加载关卡
     */
    loadLevel(level: LevelConfig): void {
        if (this.state === GameState.PLAYING) {
            this.pause();
        }

        this.currentLevel = level;
        this.questionIndex = 0;
        this.scoreSystem.init();
        this.state = GameState.READY;

        eventBus.emit('level:start', { level });
    }

    /**
     * 设置游戏模块
     */
    setModule(module: GameModule): void {
        this.currentModule = module;
        module.init(this.config);
    }

    /**
     * 开始游戏
     */
    start(): void {
        if (!this.currentLevel) {
            throw new Error('No level loaded');
        }

        if (this.state === GameState.PLAYING) {
            return;
        }

        this.state = GameState.PLAYING;
        this.scoreSystem.init();
        this.gameLoopId = requestAnimationFrame(() => this.gameLoop());

        eventBus.emit('game:start', { level: this.currentLevel });

        if (this.currentModule) {
            this.currentModule.start();
        }
    }

    /**
     * 暂停游戏
     */
    pause(): void {
        if (this.state !== GameState.PLAYING) {
            return;
        }

        this.state = GameState.PAUSED;

        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }

        eventBus.emit('game:pause');

        if (this.currentModule) {
            this.currentModule.pause();
        }
    }

    /**
     * 继续游戏
     */
    resume(): void {
        if (this.state !== GameState.PAUSED) {
            return;
        }

        this.state = GameState.PLAYING;
        this.gameLoopId = requestAnimationFrame(() => this.gameLoop());

        eventBus.emit('game:resume');

        if (this.currentModule) {
            this.currentModule.resume();
        }
    }

    /**
     * 停止游戏
     */
    stop(): void {
        if (this.state === GameState.IDLE) {
            return;
        }

        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }

        const result = this.calculateResult();
        this.state = GameState.COMPLETED;

        eventBus.emit('game:complete', { result });

        if (this.currentModule) {
            this.currentModule.stop();
        }
    }

    /**
     * 销毁游戏管理器
     */
    destroy(): void {
        this.stop();

        if (this.currentModule) {
            this.currentModule.destroy();
            this.currentModule = null;
        }

        eventBus.clear();
        this.state = GameState.IDLE;
        this.currentLevel = null;
    }

    /**
     * 游戏循环
     */
    private gameLoop(): void {
        if (this.state !== GameState.PLAYING) {
            return;
        }

        // 检查时间限制
        if (this.currentLevel?.timeLimit) {
            const elapsed = Date.now() - this.scoreSystem.getStats().startTime;
            if (elapsed >= this.currentLevel.timeLimit) {
                this.stop();
                return;
            }
        }

        this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * 记录正确答案
     */
    recordCorrect(score?: number): void {
        this.scoreSystem.recordCorrect(score);
        this.questionIndex++;

        // 检查是否完成所有题目
        if (
            this.currentLevel &&
            this.questionIndex >= this.currentLevel.questions.length
        ) {
            this.stop();
        }
    }

    /**
     * 记录错误答案
     */
    recordWrong(): void {
        this.scoreSystem.recordWrong();
        this.questionIndex++;

        // 检查是否完成所有题目
        if (
            this.currentLevel &&
            this.questionIndex >= this.currentLevel.questions.length
        ) {
            this.stop();
        }
    }

    /**
     * 计算游戏结果
     */
    private calculateResult(): GameResult {
        if (!this.currentLevel) {
            throw new Error('No level loaded');
        }

        const finalScore = this.scoreSystem.finalize();
        const stats = this.scoreSystem.getStats();
        const completed = finalScore >= this.currentLevel.minScore;

        return {
            completed,
            score: finalScore,
            maxScore: this.currentLevel.questions.reduce(
                (sum, q) => sum + q.score,
                0
            ),
            duration: (stats.endTime || Date.now()) - stats.startTime,
            correctCount: stats.correct,
            wrongCount: stats.wrong,
            timestamp: Date.now(),
        };
    }

    /**
     * 获取当前得分
     */
    getScore(): number {
        return this.scoreSystem.getCurrentScore();
    }

    /**
     * 获取游戏状态
     */
    getState(): GameState {
        return this.state;
    }

    /**
     * 获取当前关卡
     */
    getCurrentLevel(): LevelConfig | null {
        return this.currentLevel;
    }

    /**
     * 获取得分统计
     */
    getScoreStats() {
        return this.scoreSystem.getStats();
    }

    /**
     * 获取进度
     */
    getProgress(): number {
        if (!this.currentLevel) {
            return 0;
        }

        if (this.currentLevel.questions.length === 0) {
            return 100;
        }

        return (this.questionIndex / this.currentLevel.questions.length) * 100;
    }
}

export default GameManager;
