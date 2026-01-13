import { Job, JobStatus } from '@/types/database';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
    title: string;
    status: JobStatus;
    jobs: Job[];
    count: number;
    onJobClick: (jobId: string) => void;
    onJobDelete: (jobId: string) => void;
    colorClass: string;
    onDrop: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragStart: (jobId: string) => void;
}

export function KanbanColumn({
    title,
    status,
    jobs,
    count,
    onJobClick,
    onJobDelete,
    colorClass,
    onDrop,
    onDragOver,
    onDragStart
}: KanbanColumnProps) {
    return (
        <div className="flex flex-col min-w-[280px] flex-1">
            {/* Column Header */}
            <div className={cn(
                "flex items-center justify-between p-3 rounded-t-lg border-b-2",
                colorClass
            )}>
                <h3 className="font-semibold text-sm">{title}</h3>
                <span className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    colorClass.replace('border-', 'bg-').replace('/30', '/20')
                )}>
                    {count}
                </span>
            </div>

            {/* Droppable Area */}
            <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                className="flex-1 p-3 bg-muted/30 rounded-b-lg min-h-[200px]"
            >
                {jobs.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                        No hay trabajos
                    </div>
                ) : (
                    jobs.map((job) => (
                        <KanbanCard
                            key={job.id}
                            job={job}
                            onClick={() => onJobClick(job.id)}
                            onDelete={(e) => {
                                e.stopPropagation();
                                onJobDelete(job.id);
                            }}
                            onDragStart={(e) => {
                                e.dataTransfer.effectAllowed = 'move';
                                e.dataTransfer.setData('text/plain', job.id);
                                onDragStart(job.id);
                            }}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
