import { GameEvent, GameEventType, EventHandler } from './types';

/**
 * 游戏事件总线
 * 用于游戏内各个组件之间的解耦通信
 */
class EventBus {
    private handlers: Map<GameEventType, Set<EventHandler>> = new Map();
    private eventHistory: GameEvent[] = [];
    private maxHistorySize = 100;

    /**
     * 订阅事件
     */
    on(eventType: GameEventType, handler: EventHandler): () => void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set());
        }
        this.handlers.get(eventType)!.add(handler);

        // 返回取消订阅函数
        return () => this.off(eventType, handler);
    }

    /**
     * 取消订阅
     */
    off(eventType: GameEventType, handler: EventHandler): void {
        const handlers = this.handlers.get(eventType);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.handlers.delete(eventType);
            }
        }
    }

    /**
     * 发布事件
     */
    emit(eventType: GameEventType, payload?: any): void {
        const event: GameEvent = {
            type: eventType,
            payload,
            timestamp: Date.now(),
        };

        // 记录历史
        this.eventHistory.push(event);
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }

        // 通知所有订阅者
        const handlers = this.handlers.get(eventType);
        if (handlers) {
            handlers.forEach((handler) => {
                try {
                    handler(event);
                } catch (error) {
                    console.error(`Error in event handler for ${eventType}:`, error);
                }
            });
        }
    }

    /**
     * 清除所有事件订阅
     */
    clear(): void {
        this.handlers.clear();
        this.eventHistory = [];
    }

    /**
     * 获取事件历史
     */
    getHistory(eventType?: GameEventType): GameEvent[] {
        if (eventType) {
            return this.eventHistory.filter((e) => e.type === eventType);
        }
        return [...this.eventHistory];
    }

    /**
     * 获取订阅者数量
     */
    getSubscriberCount(eventType: GameEventType): number {
        return this.handlers.get(eventType)?.size || 0;
    }
}

// 导出单例实例
export const eventBus = new EventBus();
export default EventBus;
