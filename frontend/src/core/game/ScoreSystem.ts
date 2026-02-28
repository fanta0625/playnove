import { ScoreConfig, ScoreStats } from './types';
import { eventBus } from './EventBus';

/**
 * 得分系统
 * 管理游戏得分逻辑和统计
 */
class ScoreSystem {
    private config: ScoreConfig;
    private stats: ScoreStats;
    private initialized = false;

    constructor(config: ScoreConfig) {
        this.config = config;
        this.stats = {
            current: 0,
            total: 0,
            correct: 0,
            wrong: 0,
            startTime: 0,
        };
    }

    /**
     * 初始化得分系统
     */
    init(config?: Partial<ScoreConfig>): void {
        if (config) {
            this.config = { ...this.config, ...config };
        }
        this.stats = {
            current: 0,
            total: 0,
            correct: 0,
            wrong: 0,
            startTime: Date.now(),
        };
        this.initialized = true;
    }

    /**
     * 记录正确答案
     */
    recordCorrect(baseScore?: number): number {
        if (!this.initialized) {
            throw new Error('ScoreSystem not initialized');
        }

        const score = baseScore || this.config.baseScore;
        this.stats.current += score;
        this.stats.total += score;
        this.stats.correct += 1;

        // 触发得分更新事件
        eventBus.emit('score:update', {
            score: this.stats.current,
            correct: this.stats.correct,
            wrong: this.stats.wrong,
        });

        return this.stats.current;
    }

    /**
     * 记录错误答案
     */
    recordWrong(): number {
        if (!this.initialized) {
            throw new Error('ScoreSystem not initialized');
        }

        const penalty = Math.min(
            this.config.penaltyPerWrong,
            this.stats.current
        );
        this.stats.current -= penalty;
        this.stats.wrong += 1;

        // 确保得分不为负
        if (this.stats.current < 0) {
            this.stats.current = 0;
        }

        // 触发得分更新事件
        eventBus.emit('score:update', {
            score: this.stats.current,
            correct: this.stats.correct,
            wrong: this.stats.wrong,
        });

        return this.stats.current;
    }

    /**
     * 计算时间奖励
     */
    calculateTimeBonus(): number {
        if (!this.initialized) {
            return 0;
        }

        const elapsed = Date.now() - this.stats.startTime;
        const bonus = Math.floor(
            this.config.bonusPerSecond * Math.max(0, (60000 - elapsed) / 1000)
        );

        return Math.min(bonus, this.config.maxScore - this.stats.current);
    }

    /**
     * 完成关卡，计算最终得分
     */
    finalize(): number {
        if (!this.initialized) {
            throw new Error('ScoreSystem not initialized');
        }

        this.stats.endTime = Date.now();
        const timeBonus = this.calculateTimeBonus();
        this.stats.current += timeBonus;

        // 确保不超过最大得分
        this.stats.current = Math.min(this.stats.current, this.config.maxScore);

        return this.stats.current;
    }

    /**
     * 获取当前得分
     */
    getCurrentScore(): number {
        return this.stats.current;
    }

    /**
     * 获取统计数据
     */
    getStats(): ScoreStats {
        return { ...this.stats };
    }

    /**
     * 重置得分系统
     */
    reset(): void {
        this.stats = {
            current: 0,
            total: 0,
            correct: 0,
            wrong: 0,
            startTime: 0,
        };
        this.initialized = false;
    }

    /**
     * 获取进度百分比
     */
    getProgress(): number {
        return Math.min(
            (this.stats.current / this.config.maxScore) * 100,
            100
        );
    }
}

export default ScoreSystem;
