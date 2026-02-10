import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate and download project completion report as PDF
 * @param {Object} data - Report data from API
 */
export const generateProjectPDF = (data) => {
    const { project, milestones, tasks, report } = data;

    // Create PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Helper function to add new page if needed
    const checkNewPage = (neededSpace = 30) => {
        if (yPos + neededSpace > 280) {
            doc.addPage();
            yPos = 20;
        }
    };

    // ========== TITLE PAGE ==========
    // Header gradient effect (using rectangle)
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(0, 0, pageWidth, 60, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('PROJECT COMPLETION REPORT', pageWidth / 2, 35, { align: 'center' });

    // Project name
    doc.setFontSize(16);
    doc.setTextColor(6, 182, 212); // Cyan
    doc.text(project.title.toUpperCase(), pageWidth / 2, 50, { align: 'center' });

    yPos = 80;

    // Project Info Box
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.roundedRect(margin, yPos - 10, pageWidth - 2 * margin, 50, 3, 3, 'F');

    doc.setTextColor(30, 41, 59); // Slate-800
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const infoStartY = yPos;
    doc.text(`Team Lead: ${project.creator?.name || 'N/A'}`, margin + 10, infoStartY);
    doc.text(`Mentor: ${project.mentor?.name || 'N/A'}`, margin + 10, infoStartY + 10);
    doc.text(`Team Members: ${project.teamMembers?.map(m => m.name).join(', ') || 'N/A'}`, margin + 10, infoStartY + 20);
    doc.text(`Status: ${project.status}`, pageWidth - margin - 50, infoStartY);
    doc.text(`Start: ${project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}`, pageWidth - margin - 50, infoStartY + 10);
    doc.text(`End: ${project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}`, pageWidth - margin - 50, infoStartY + 20);

    yPos = infoStartY + 60;

    // ========== EXECUTIVE SUMMARY ==========
    doc.setFillColor(6, 182, 212);
    doc.rect(margin, yPos, 4, 20, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE SUMMARY', margin + 10, yPos + 12);

    yPos += 30;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(report.executiveSummary || 'N/A', pageWidth - 2 * margin);
    doc.text(summaryLines, margin, yPos);
    yPos += summaryLines.length * 6 + 15;

    // ========== PROJECT OVERVIEW ==========
    checkNewPage(50);
    doc.setFillColor(139, 92, 246); // Violet
    doc.rect(margin, yPos, 4, 20, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PROJECT OVERVIEW', margin + 10, yPos + 12);

    yPos += 30;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const overviewLines = doc.splitTextToSize(report.projectOverview || project.description || 'N/A', pageWidth - 2 * margin);
    doc.text(overviewLines, margin, yPos);
    yPos += overviewLines.length * 6 + 15;

    // ========== TECHNOLOGIES USED ==========
    checkNewPage(80);
    doc.setFillColor(16, 185, 129); // Emerald
    doc.rect(margin, yPos, 4, 20, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TECHNOLOGIES USED', margin + 10, yPos + 12);

    yPos += 30;

    const techCategories = [
        { name: 'Frontend', items: report.technologiesUsed?.frontend || [] },
        { name: 'Backend', items: report.technologiesUsed?.backend || [] },
        { name: 'Database', items: report.technologiesUsed?.database || [] },
        { name: 'Other Tools', items: report.technologiesUsed?.other || [] }
    ];

    techCategories.forEach(cat => {
        if (cat.items.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(`${cat.name}:`, margin, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(cat.items.join(', '), margin + 30, yPos);
            yPos += 8;
        }
    });
    yPos += 10;

    // ========== FEATURES IMPLEMENTED ==========
    checkNewPage(60);
    doc.setFillColor(59, 130, 246); // Blue
    doc.rect(margin, yPos, 4, 20, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FEATURES IMPLEMENTED', margin + 10, yPos + 12);

    yPos += 30;

    if (report.featuresImplemented?.length > 0) {
        report.featuresImplemented.forEach((feature, idx) => {
            checkNewPage(20);
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(margin, yPos - 5, pageWidth - 2 * margin, 18, 2, 2, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(`${idx + 1}. ${feature.name}`, margin + 5, yPos + 3);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            const descLines = doc.splitTextToSize(feature.description, pageWidth - 2 * margin - 20);
            doc.text(descLines, margin + 10, yPos + 10);

            yPos += 22;
        });
    }
    yPos += 10;

    // ========== MILESTONES ==========
    checkNewPage(60);
    doc.setFillColor(245, 158, 11); // Amber
    doc.rect(margin, yPos, 4, 20, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MILESTONES ACHIEVED', margin + 10, yPos + 12);

    yPos += 30;

    if (milestones?.length > 0) {
        const milestoneData = milestones.map((m, idx) => [
            idx + 1,
            m.title,
            m.status === 'Approved' || m.status === 'approved' ? '✓ Completed' : m.status
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['#', 'Milestone', 'Status']],
            body: milestoneData,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42] },
            margin: { left: margin, right: margin },
            styles: { fontSize: 9 }
        });

        yPos = doc.lastAutoTable.finalY + 15;
    }

    // ========== FUTURE SCOPE ==========
    checkNewPage(60);
    doc.setFillColor(236, 72, 153); // Pink
    doc.rect(margin, yPos, 4, 20, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FUTURE SCOPE', margin + 10, yPos + 12);

    yPos += 30;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    if (report.futureScope?.length > 0) {
        report.futureScope.forEach(item => {
            checkNewPage(15);
            doc.text(`• ${item}`, margin + 5, yPos);
            yPos += 8;
        });
    }
    yPos += 10;

    // ========== LESSONS LEARNED ==========
    checkNewPage(50);
    doc.setFillColor(34, 211, 238); // Cyan
    doc.rect(margin, yPos, 4, 20, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LESSONS LEARNED', margin + 10, yPos + 12);

    yPos += 30;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    if (report.lessonsLearned?.length > 0) {
        report.lessonsLearned.forEach(item => {
            checkNewPage(15);
            doc.text(`• ${item}`, margin + 5, yPos);
            yPos += 8;
        });
    }
    yPos += 10;

    // ========== CONCLUSION ==========
    checkNewPage(50);
    doc.setFillColor(99, 102, 241); // Indigo
    doc.rect(margin, yPos, 4, 20, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CONCLUSION', margin + 10, yPos + 12);

    yPos += 30;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const conclusionLines = doc.splitTextToSize(report.conclusion || 'Project completed successfully.', pageWidth - 2 * margin);
    doc.text(conclusionLines, margin, yPos);

    // ========== FOOTER ==========
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated by Nexus Project Management System | ${new Date().toLocaleDateString()}`, pageWidth / 2, 290, { align: 'center' });
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, 290, { align: 'right' });
    }

    // Save PDF
    const fileName = `${project.title.replace(/[^a-z0-9]/gi, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    return fileName;
};

export default generateProjectPDF;
