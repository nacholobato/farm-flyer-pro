import { useState } from 'react';
import { Job, JobStatus } from '@/types/database';
import { useUpdateJob } from '@/hooks/useJobs';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
    jobs: Job[];
    onJobClick: (jobId: string) => void;
    onJobDelete: (jobId: string) => void;
}

const columns = [
    {
        status: 'pending' as JobStatus,
        title: 'Pendiente',
        colorClass: 'border-warning/30 bg-warning/5'
    },
    {
        status: 'in_progress' as JobStatus,
        title: 'En Progreso',
        colorClass: 'border-info/30 bg-info/5'
    },
    {
        status: 'done' as JobStatus,
        title: 'Completado',
        colorClass: 'border-success/30 bg-success/5'
    },
];

export function KanbanBoard({ jobs, onJobClick, onJobDelete }: KanbanBoardProps) {
    const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
    const updateJob = useUpdateJob();

    const handleDragStart = (jobId: string) => {
        setDraggedJobId(jobId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow drop
    };

    const handleDrop = (newStatus: JobStatus) => (e: React.DragEvent) => {
        e.preventDefault();

        const jobId = e.dataTransfer.getData('text/plain');
        const job = jobs.find(j => j.id === jobId);

        if (job && job.status !== newStatus) {
            updateJob.mutate({ id: jobId, status: newStatus });
        }

        setDraggedJobId(null);
    };

    // Group jobs by status
    const jobsByStatus = {
        pending: jobs.filter(j => j.status === 'pending'),
        in_progress: jobs.filter(j => j.status === 'in_progress'),
        done: jobs.filter(j => j.status === 'done'),
    };

    return (
        <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map(({ status, title, colorClass }) => (
                <KanbanColumn
                    key={status}
                    status={status}
                    title={title}
                    jobs={jobsByStatus[status]}
                    count={jobsByStatus[status].length}
                    onJobClick={onJobClick}
                    onJobDelete={onJobDelete}
                    colorClass={colorClass}
                    onDrop={handleDrop(status)}
                    onDragOver={handleDragOver}
                    onDragStart={handleDragStart}
                />
            ))}
        </div>
    );
}
