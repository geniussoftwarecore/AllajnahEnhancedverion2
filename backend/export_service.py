import pandas as pd
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from typing import List, Dict, Any
from datetime import datetime
import arabic_reshaper
from bidi.algorithm import get_display
import os


class ExportService:
    def __init__(self):
        font_path = os.path.join(os.path.dirname(__file__), 'fonts', 'NotoSansArabic.ttf')
        if os.path.exists(font_path):
            try:
                pdfmetrics.registerFont(TTFont('Arabic', font_path))
                self.arabic_font_available = True
            except Exception as e:
                print(f"Failed to register Arabic font: {e}")
                self.arabic_font_available = False
        else:
            print(f"Arabic font not found at {font_path}")
            self.arabic_font_available = False
    
    @staticmethod
    def reshape_arabic_text(text: str) -> str:
        if not text:
            return text
        try:
            reshaped_text = arabic_reshaper.reshape(text)
            bidi_text = get_display(reshaped_text)
            return bidi_text
        except Exception as e:
            print(f"Error reshaping Arabic text: {e}")
            return text
    
    @staticmethod
    def export_to_csv(data: List[Dict[str, Any]], filename: str = "export.csv") -> BytesIO:
        df = pd.DataFrame(data)
        buffer = BytesIO()
        df.to_csv(buffer, index=False, encoding='utf-8-sig')
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def export_to_excel(data: List[Dict[str, Any]], sheet_name: str = "Data") -> BytesIO:
        df = pd.DataFrame(data)
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=sheet_name, index=False)
        buffer.seek(0)
        return buffer
    
    def generate_complaint_pdf(self, complaint_data: Dict[str, Any]) -> BytesIO:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50)
        styles = getSampleStyleSheet()
        
        font_name = 'Arabic' if self.arabic_font_available else 'Helvetica'
        
        style_title = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            alignment=TA_CENTER,
            spaceAfter=30,
            fontName=font_name,
            fontSize=18
        )
        
        style_rtl = ParagraphStyle(
            'RTLStyle',
            parent=styles['Normal'],
            alignment=TA_RIGHT,
            fontName=font_name,
            fontSize=11
        )
        
        story = []
        
        title_text = self.reshape_arabic_text(f"تقرير الشكوى #{complaint_data.get('id', 'N/A')}")
        title = Paragraph(title_text, style_title)
        story.append(title)
        story.append(Spacer(1, 20))
        
        data = [
            [self.reshape_arabic_text('القيمة'), self.reshape_arabic_text('الحقل')],
            [str(complaint_data.get('id', 'N/A')), self.reshape_arabic_text('رقم الشكوى')],
            [self.reshape_arabic_text(complaint_data.get('status', 'N/A')), self.reshape_arabic_text('الحالة')],
            [self.reshape_arabic_text(complaint_data.get('priority', 'N/A')), self.reshape_arabic_text('الأولوية')],
            [self.reshape_arabic_text(complaint_data.get('category', 'N/A')), self.reshape_arabic_text('الفئة')],
            [complaint_data.get('created_at', 'N/A'), self.reshape_arabic_text('تاريخ الإنشاء')],
            [self.reshape_arabic_text(complaint_data.get('trader_name', 'N/A')), self.reshape_arabic_text('التاجر')],
        ]
        
        table = Table(data, colWidths=[300, 150])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#22c55e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), font_name),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f0fdf4')),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        story.append(table)
        story.append(Spacer(1, 25))
        
        if complaint_data.get('description'):
            desc_title = Paragraph(f"<b>{self.reshape_arabic_text('الوصف:')}</b>", style_rtl)
            story.append(desc_title)
            story.append(Spacer(1, 10))
            desc_text = Paragraph(self.reshape_arabic_text(complaint_data.get('description', '')), style_rtl)
            story.append(desc_text)
            story.append(Spacer(1, 15))
        
        if complaint_data.get('complaint_summary'):
            summary_title = Paragraph(f"<b>{self.reshape_arabic_text('ملخص الشكوى:')}</b>", style_rtl)
            story.append(summary_title)
            story.append(Spacer(1, 10))
            summary_text = Paragraph(self.reshape_arabic_text(complaint_data.get('complaint_summary', '')), style_rtl)
            story.append(summary_text)
        
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    def generate_analytics_report(self, analytics_data: Dict[str, Any]) -> BytesIO:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50)
        styles = getSampleStyleSheet()
        
        font_name = 'Arabic' if self.arabic_font_available else 'Helvetica'
        
        style_title = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            alignment=TA_CENTER,
            fontName=font_name,
            fontSize=18,
            spaceAfter=20
        )
        
        style_rtl = ParagraphStyle(
            'RTLStyle',
            parent=styles['Normal'],
            alignment=TA_RIGHT,
            fontName=font_name,
            fontSize=11
        )
        
        story = []
        title = Paragraph(self.reshape_arabic_text("تقرير التحليلات"), style_title)
        story.append(title)
        story.append(Spacer(1, 15))
        
        date_info = Paragraph(self.reshape_arabic_text(f"تاريخ الإنشاء: {datetime.now().strftime('%Y-%m-%d %H:%M')}"), style_rtl)
        story.append(date_info)
        story.append(Spacer(1, 25))
        
        data = [
            [self.reshape_arabic_text('القيمة'), self.reshape_arabic_text('المؤشر')],
            [str(analytics_data.get('total_complaints', 0)), self.reshape_arabic_text('إجمالي الشكاوى')],
            [str(analytics_data.get('pending_count', 0)), self.reshape_arabic_text('قيد الانتظار')],
            [str(analytics_data.get('in_progress_count', 0)), self.reshape_arabic_text('قيد المراجعة')],
            [str(analytics_data.get('resolved_count', 0)), self.reshape_arabic_text('محلولة')],
            [str(analytics_data.get('rejected_count', 0)), self.reshape_arabic_text('مرفوضة')],
        ]
        
        table = Table(data, colWidths=[150, 300])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#22c55e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), font_name),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f0fdf4')),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        story.append(table)
        doc.build(story)
        buffer.seek(0)
        return buffer


export_service = ExportService()
