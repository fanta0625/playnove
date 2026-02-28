// 游戏配置接口
export interface GameConfig {
    canvasId?: string;
    width?: number;
    height?: number;
    background?: string;
    soundEnabled?: boolean;
}

// 游戏状态
export enum GameState {
    IDLE = 'idle',
    LOADING = 'loading',
    READY = 'ready',
    PLAYING = 'playing',
    PAUSED = 'paused',
    COMPLETED = 'completed',
    ERROR = 'error',
}

// 游戏事件类型
export type GameEventType =
    | 'game:ready'
    | 'game:start'
    | 'game:pause'
    | 'game:resume'
    | 'game:complete'
    | 'game:error'
    | 'score:update'
    | 'level:start'
    | 'level:complete'
    | 'interaction';

// 游戏事件接口
export interface GameEvent {
    type: GameEventType;
    payload?: any;
    timestamp: number;
}

// 事件处理器
export type EventHandler = (event: GameEvent) => void;

// 关卡配置
export interface LevelConfig {
    id: string;
    number: number;
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    minScore: number;
    timeLimit?: number; // 毫秒
    questions: QuestionConfig[];
}

// 题目配置
export interface QuestionConfig {
    id: string;
    type: string;
    content: any;
    answer: any;
    score: number;
    timeLimit?: number;
}

// 得分配置
export interface ScoreConfig {
    baseScore: number;
    bonusPerSecond: number;
    penaltyPerWrong: number;
    maxScore: number;
}

// 得分统计
export interface ScoreStats {
    current: number;
    total: number;
    correct: number;
    wrong: number;
    startTime: number;
    endTime?: number;
}

// 游戏结果
export interface GameResult {
    completed: boolean;
    score: number;
    maxScore: number;
    duration: number;
    correctCount: number;
    wrongCount: number;
    timestamp: number;
}
