import { jsPDF } from 'jspdf';
import { Job, AgrochemicalUsed } from '@/types/database';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface JobPdfData {
    job: Job;
    agrochemicals: AgrochemicalUsed[];
    clientName?: string;
    farmName?: string;
}

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    done: 'Completado',
};

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    try {
        return format(new Date(dateStr + 'T12:00:00'), "d 'de' MMMM, yyyy", { locale: es });
    } catch {
        return dateStr;
    }
}

export function generateJobPdf({ job, agrochemicals, clientName, farmName }: JobPdfData) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    // Helper: check if we need a new page
    const checkPage = (needed: number) => {
        if (y + needed > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            y = 20;
        }
    };

    // ── Header ──
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Informe de Trabajo', margin, y);
    y += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(job.title, margin, y);
    y += 8;

    // Thin line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // ── Job Details ──
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Datos del Trabajo', margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const details: [string, string][] = [
        ['Cliente', clientName || '-'],
        ['Campo', farmName || '-'],
        ['Cultivo', job.cultivo || '-'],
        ['Cuadro', job.cuadro || '-'],
        ['Superficie Teórica', job.superficie_teorica_has ? `${job.superficie_teorica_has} has` : '-'],
        ['Tarea', job.task || '-'],
        ['Dosis de Aplicación', job.application_dose || '-'],
        ['Estado', STATUS_LABELS[job.status] || job.status],
        ['Fecha de Inicio', formatDate(job.start_date)],
        ['Fecha de Vencimiento', formatDate(job.due_date)],
    ];

    details.forEach(([label, value]) => {
        checkPage(6);
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 50, y);
        y += 6;
    });

    if (job.description) {
        y += 4;
        checkPage(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Descripción:', margin, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(job.description, contentWidth);
        doc.text(descLines, margin, y);
        y += descLines.length * 5 + 2;
    }

    if (job.notes) {
        y += 4;
        checkPage(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Notas:', margin, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        const notesLines = doc.splitTextToSize(job.notes, contentWidth);
        doc.text(notesLines, margin, y);
        y += notesLines.length * 5 + 2;
    }

    // ── Agrochemicals ──
    if (agrochemicals.length > 0) {
        y += 8;
        checkPage(20);
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Agroquímicos Utilizados', margin, y);
        y += 8;

        // Table header
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y - 4, contentWidth, 7, 'F');
        doc.text('#', margin + 2, y);
        doc.text('Producto', margin + 10, y);
        doc.text('Dosis', margin + 90, y);
        doc.text('Unidad', margin + 120, y);
        doc.text('Notas', margin + 145, y);
        y += 8;

        doc.setFont('helvetica', 'normal');
        agrochemicals.forEach((agro, index) => {
            checkPage(8);
            doc.text(`${index + 1}`, margin + 2, y);
            doc.text(agro.product_name, margin + 10, y);
            doc.text(agro.dose.toString(), margin + 90, y);
            doc.text(agro.unit, margin + 120, y);
            doc.text(agro.notes || '-', margin + 145, y);
            y += 7;
        });
    }

    // ── Footer ──
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150);
        doc.text(
            `Generado el ${format(new Date(), "d/M/yyyy HH:mm", { locale: es })} — Página ${i} de ${pageCount}`,
            margin,
            doc.internal.pageSize.getHeight() - 10
        );
        doc.setTextColor(0);
    }

    // Save
    const safeName = job.title.replace(/[^a-zA-Z0-9áéíóúñ ]/gi, '').trim().replace(/\s+/g, '_');
    doc.save(`${safeName}_informe.pdf`);
}
