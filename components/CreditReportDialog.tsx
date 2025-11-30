'use client';

import { useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import {
  FileText,
  Download,
  Loader2,
  Calendar,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Clock,
  Server,
} from 'lucide-react';
import { CreditReport } from '@/types';

interface CreditReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreditReportDialog({ open, onOpenChange }: CreditReportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<CreditReport | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        throw new Error('Não autenticado');
      }

      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });

      const response = await fetch(`/api/credits/report?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao gerar relatório');
      }

      const data = await response.json();
      setReport(data.report);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const generatePDF = useCallback(() => {
    if (!report) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Helper functions
    const addText = (text: string, x: number, currentY: number, options?: any) => {
      doc.text(text, x, currentY, options);
    };

    const addLine = () => {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
    };

    const formatDate = (date: Date | string) => {
      return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

    const formatCredits = (credits: number) => credits.toFixed(2);
    const formatCurrency = (credits: number) => `€${(credits * 0.01).toFixed(2)}`;

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    addText('Relatório de Créditos Exaroton', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    addText(
      `Período: ${formatDate(report.period.start)} - ${formatDate(report.period.end)}`,
      pageWidth / 2,
      y,
      { align: 'center' }
    );
    y += 5;
    addText(
      `Gerado em: ${new Date(report.generatedAt).toLocaleString('pt-BR')}`,
      pageWidth / 2,
      y,
      { align: 'center' }
    );
    y += 15;

    addLine();

    // Summary Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    addText('Resumo Geral', margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const summaryData = [
      ['Créditos Iniciais:', `${formatCredits(report.summary.startCredits)} (${formatCurrency(report.summary.startCredits)})`],
      ['Créditos Finais:', `${formatCredits(report.summary.endCredits)} (${formatCurrency(report.summary.endCredits)})`],
      ['Total Gasto:', `${formatCredits(report.summary.totalSpent)} (${formatCurrency(report.summary.totalSpent)})`],
      ['Média por Dia:', `${formatCredits(report.summary.averagePerDay)} créditos/dia`],
      ['Média por Hora:', `${formatCredits(report.summary.averagePerHour)} créditos/hora`],
      ['Projeção Mensal:', `${formatCredits(report.summary.projectedMonthly)} créditos (~${formatCurrency(report.summary.projectedMonthly)})`],
    ];

    summaryData.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      addText(label, margin, y);
      doc.setFont('helvetica', 'normal');
      addText(value, margin + 50, y);
      y += 6;
    });

    y += 10;
    addLine();

    // Daily Breakdown
    if (report.dailyBreakdown.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      addText('Detalhamento Diário', margin, y);
      y += 10;

      // Table header
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 4, pageWidth - margin * 2, 8, 'F');
      
      const colWidths = [40, 40, 40, 40];
      let x = margin + 5;
      ['Data', 'Início', 'Fim', 'Gasto'].forEach((header, i) => {
        addText(header, x, y);
        x += colWidths[i];
      });
      y += 8;

      // Table rows
      doc.setFont('helvetica', 'normal');
      report.dailyBreakdown.slice(-15).forEach((day, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y - 4, pageWidth - margin * 2, 6, 'F');
        }

        x = margin + 5;
        addText(formatDate(day.date), x, y);
        x += colWidths[0];
        addText(formatCredits(day.startCredits), x, y);
        x += colWidths[1];
        addText(formatCredits(day.endCredits), x, y);
        x += colWidths[2];
        
        doc.setTextColor(220, 38, 38);
        addText(`-${formatCredits(day.spent)}`, x, y);
        doc.setTextColor(0, 0, 0);
        
        y += 6;
      });

      y += 10;
      addLine();
    }

    // Server Usage
    if (report.serverUsage.length > 0) {
      if (y > 220) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      addText('Uso por Servidor', margin, y);
      y += 10;

      // Table header
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 4, pageWidth - margin * 2, 8, 'F');

      const serverColWidths = [60, 30, 30, 40];
      let x = margin + 5;
      ['Servidor', 'RAM (GB)', 'Horas', 'Créditos Est.'].forEach((header, i) => {
        addText(header, x, y);
        x += serverColWidths[i];
      });
      y += 8;

      // Table rows
      doc.setFont('helvetica', 'normal');
      report.serverUsage.forEach((server, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y - 4, pageWidth - margin * 2, 6, 'F');
        }

        x = margin + 5;
        addText(server.serverName.substring(0, 25), x, y);
        x += serverColWidths[0];
        addText(server.ramGB.toString(), x, y);
        x += serverColWidths[1];
        addText(server.totalHoursRunning.toString(), x, y);
        x += serverColWidths[2];
        addText(formatCredits(server.estimatedCreditsUsed), x, y);
        
        y += 6;
      });

      y += 10;
    }

    // Footer
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    y = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    addText(
      'Relatório gerado automaticamente pelo MineServerManager',
      pageWidth / 2,
      y,
      { align: 'center' }
    );
    y += 4;
    addText(
      'Dados baseados em snapshots salvos no Firebase',
      pageWidth / 2,
      y,
      { align: 'center' }
    );

    // Save the PDF
    const fileName = `relatorio-creditos-${formatDate(report.period.start)}-${formatDate(report.period.end)}.pdf`;
    doc.save(fileName);
  }, [report]);

  const formatCredits = (value: number) => value.toFixed(2);
  const formatCurrency = (credits: number) => `€${(credits * 0.01).toFixed(2)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatório de Créditos
          </DialogTitle>
          <DialogDescription>
            Gere um relatório detalhado dos seus gastos de créditos em PDF
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Range Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={fetchReport}
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <BarChart3 className="mr-2 h-4 w-4" />
                Carregar Dados
              </>
            )}
          </Button>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {report && (
            <>
              <Separator />

              {/* Report Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Prévia do Relatório
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {new Date(report.generatedAt).toLocaleString('pt-BR')}
                  </Badge>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingDown className="h-4 w-4" />
                      <span className="text-xs">Total Gasto</span>
                    </div>
                    <p className="text-lg font-bold text-red-500">
                      -{formatCredits(report.summary.totalSpent)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(report.summary.totalSpent)}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs">Projeção Mensal</span>
                    </div>
                    <p className="text-lg font-bold text-amber-500">
                      ~{formatCredits(report.summary.projectedMonthly)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ~{formatCurrency(report.summary.projectedMonthly)}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">Média/Dia</span>
                    </div>
                    <p className="text-lg font-bold">
                      {formatCredits(report.summary.averagePerDay)}
                    </p>
                    <p className="text-xs text-muted-foreground">créditos/dia</p>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Server className="h-4 w-4" />
                      <span className="text-xs">Servidores</span>
                    </div>
                    <p className="text-lg font-bold">
                      {report.serverUsage.length}
                    </p>
                    <p className="text-xs text-muted-foreground">com uso registrado</p>
                  </div>
                </div>

                {/* Daily Breakdown Mini Chart */}
                {report.dailyBreakdown.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-2">
                      Últimos {Math.min(7, report.dailyBreakdown.length)} dias
                    </p>
                    <div className="flex items-end gap-1 h-16">
                      {report.dailyBreakdown.slice(-7).map((day, i) => {
                        const maxSpent = Math.max(
                          ...report.dailyBreakdown.slice(-7).map((d) => d.spent)
                        );
                        const height = maxSpent > 0 ? (day.spent / maxSpent) * 100 : 0;
                        return (
                          <div
                            key={i}
                            className="flex-1 bg-red-500/70 rounded-t transition-all"
                            style={{ height: `${Math.max(height, 5)}%` }}
                            title={`${new Date(day.date).toLocaleDateString('pt-BR')}: -${formatCredits(day.spent)}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={generatePDF} disabled={!report || loading}>
            <Download className="mr-2 h-4 w-4" />
            Baixar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
