import { Job } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Calendar, Trash2, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface KanbanCardProps {
    job: Job;
    onClick: () => void;
    onDelete: (e: React.MouseEvent) => void;
    onDragStart: (e: React.DragEvent) => void;
}

export function KanbanCard({ job, onClick, onDelete, onDragStart }: KanbanCardProps) {
    return (
        <div
            draggable
            onDragStart={onDragStart}
            className="mb-3"
        >
            <Card
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                onClick={onClick}
            >
                <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                        {/* Drag Handle */}
                        <div className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground">
                            <GripVertical className="h-4 w-4" />
                        </div>

                        {/* Card Content */}
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-2 truncate">{job.title}</h4>

                            <div className="space-y-1 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1 truncate">
                                    <Users className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{job.client?.name}</span>
                                </div>

                                <div className="flex items-center gap-1 truncate">
                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{job.farm?.name}</span>
                                </div>

                                {job.due_date && (
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3 flex-shrink-0" />
                                        <span>{format(new Date(job.due_date), 'dd MMM yyyy', { locale: es })}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Delete Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={onDelete}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
