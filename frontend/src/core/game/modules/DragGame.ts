import { GameConfig } from '../types';
import { GameModule } from '../GameManager';
import { eventBus } from '../EventBus';

interface DragItem {
    id: string;
    content: any;
    x: number;
    y: number;
    targetId?: string;
}

/**
 * 拖拽游戏模块
 * 示例：将物品拖拽到正确的位置
 */
class DragGame implements GameModule {
    private config: GameConfig;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private items: DragItem[] = [];
    private draggedItem: DragItem | null = null;
    private dragOffset = { x: 0, y: 0 };
    private initialized = false;

    constructor() {
        this.config = {};
    }

    init(config: GameConfig): void {
        this.config = config;

        if (config.canvasId) {
            this.canvas = document.getElementById(config.canvasId) as HTMLCanvasElement;
            if (this.canvas) {
                this.ctx = this.canvas.getContext('2d');
                this.setupCanvas();
            }
        }

        this.initialized = true;
    }

    private setupCanvas(): void {
        if (!this.canvas) return;

        this.canvas.width = this.config.width || 800;
        this.canvas.height = this.config.height || 600;

        // 设置事件监听
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));

        // 触摸事件
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    start(): void {
        if (!this.initialized) {
            throw new Error('DragGame not initialized');
        }
        this.render();
    }

    pause(): void {
        // 暂停逻辑
    }

    resume(): void {
        // 继续逻辑
        this.render();
    }

    stop(): void {
        // 停止逻辑
    }

    destroy(): void {
        if (this.canvas) {
            this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
            this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
            this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
            this.canvas.removeEventListener('mouseleave', this.handleMouseUp.bind(this));
            this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
            this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
            this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
        }

        this.items = [];
        this.draggedItem = null;
        this.initialized = false;
    }

    /**
     * 设置游戏物品
     */
    setItems(items: DragItem[]): void {
        this.items = items;
        this.render();
    }

    private handleMouseDown(e: MouseEvent): void {
        const pos = this.getMousePos(e);
        const item = this.getItemAtPosition(pos.x, pos.y);

        if (item) {
            this.draggedItem = item;
            this.dragOffset = {
                x: pos.x - item.x,
                y: pos.y - item.y,
            };

            eventBus.emit('interaction', {
                type: 'drag:start',
                itemId: item.id,
            });
        }
    }

    private handleMouseMove(e: MouseEvent): void {
        if (!this.draggedItem) return;

        const pos = this.getMousePos(e);
        this.draggedItem.x = pos.x - this.dragOffset.x;
        this.draggedItem.y = pos.y - this.dragOffset.y;

        this.render();
    }

    private handleMouseUp(): void {
        if (!this.draggedItem) return;

        // 检查是否放置到目标位置
        if (this.checkTarget(this.draggedItem)) {
            eventBus.emit('interaction', {
                type: 'drag:success',
                itemId: this.draggedItem.id,
            });
        } else {
            eventBus.emit('interaction', {
                type: 'drag:fail',
                itemId: this.draggedItem.id,
            });
        }

        this.draggedItem = null;
        this.render();
    }

    private handleTouchStart(e: TouchEvent): void {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY,
        });
        this.handleMouseDown(mouseEvent);
    }

    private handleTouchMove(e: TouchEvent): void {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY,
        });
        this.handleMouseMove(mouseEvent);
    }

    private handleTouchEnd(_e: TouchEvent): void {
        this.handleMouseUp();
    }

    private getMousePos(e: MouseEvent): { x: number; y: number } {
        if (!this.canvas) return { x: 0, y: 0 };

        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    }

    private getItemAtPosition(x: number, y: number): DragItem | null {
        return this.items.find((item) => {
            const size = 60; // 假设物品大小为60x60
            return (
                x >= item.x &&
                x <= item.x + size &&
                y >= item.y &&
                y <= item.y + size
            );
        }) || null;
    }

    private checkTarget(_item: DragItem): boolean {
        // 简化的目标检查逻辑
        // 实际项目中应根据题目的targetId判断
        return Math.random() > 0.5; // 50%概率成功，仅作演示
    }

    private render(): void {
        if (!this.ctx || !this.canvas) return;

        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制背景
        if (this.config.background) {
            this.ctx.fillStyle = this.config.background;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // 绘制物品
        this.items.forEach((item) => {
            this.drawItem(item);
        });
    }

    private drawItem(item: DragItem): void {
        if (!this.ctx) return;

        const size = 60;

        // 绘制物品背景
        this.ctx.fillStyle = '#3B82F6';
        this.ctx.beginPath();
        this.ctx.roundRect(item.x, item.y, size, size, 10);
        this.ctx.fill();

        // 绘制边框
        this.ctx.strokeStyle = '#1D4ED8';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // 绘制内容（文本或图片）
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            item.content.text || '🎯',
            item.x + size / 2,
            item.y + size / 2
        );
    }
}

export default DragGame;
