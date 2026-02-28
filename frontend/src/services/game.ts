import api from './api';

export interface GameType {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'drag' | 'match' | 'count' | 'puzzle' | 'sort';
}

export interface Level {
    id: string;
    gameId: string;
    levelNumber: number;
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    questions: Question[];
    minScore: number;
}

export interface Question {
    id: string;
    type: string;
    content: any;
    answer: any;
}

export interface PlayRecord {
    id: string;
    gameId: string;
    levelId: string;
    score: number;
    completed: boolean;
    duration: number;
    playedAt: string;
}

export const gameService = {
    // 获取所有游戏类型
    getGames: async (): Promise<GameType[]> => {
        return api.get('/games');
    },

    // 获取游戏详情
    getGameDetail: async (gameId: string): Promise<GameType> => {
        return api.get(`/games/${gameId}`);
    },

    // 获取游戏关卡列表
    getLevels: async (gameId: string): Promise<Level[]> => {
        return api.get(`/games/${gameId}/levels`);
    },

    // 获取关卡详情
    getLevelDetail: async (
        gameId: string,
        levelId: string
    ): Promise<Level> => {
        return api.get(`/games/${gameId}/levels/${levelId}`);
    },

    // 提交游戏记录
    submitRecord: async (data: {
        gameId: string;
        levelId: string;
        score: number;
        completed: boolean;
        duration: number;
    }): Promise<PlayRecord> => {
        return api.post('/games/records', data);
    },

    // 获取用户游戏记录
    getRecords: async (): Promise<PlayRecord[]> => {
        return api.get('/games/records');
    },

    // 获取游戏统计
    getStats: async () => {
        return api.get('/games/stats');
    },
};
