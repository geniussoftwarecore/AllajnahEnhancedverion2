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


class ExportService:
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
    
    @staticmethod
    def generate_complaint_pdf(complaint_data: Dict[str, Any]) -> BytesIO:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        
        style_title = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            alignment=TA_CENTER,
            spaceAfter=30
        )
        
        style_normal = styles['Normal']
        
        story = []
        
        title = Paragraph(f"Complaint Report #{complaint_data.get('id', 'N/A')}", style_title)
        story.append(title)
        story.append(Spacer(1, 12))
        
        data = [
            ['Field', 'Value'],
            ['Complaint ID', str(complaint_data.get('id', 'N/A'))],
            ['Status', complaint_data.get('status', 'N/A')],
            ['Priority', complaint_data.get('priority', 'N/A')],
            ['Category', complaint_data.get('category', 'N/A')],
            ['Created', complaint_data.get('created_at', 'N/A')],
            ['Trader', complaint_data.get('trader_name', 'N/A')],
        ]
        
        table = Table(data, colWidths=[200, 300])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(table)
        story.append(Spacer(1, 20))
        
        if complaint_data.get('description'):
            desc_title = Paragraph("<b>Description:</b>", style_normal)
            story.append(desc_title)
            story.append(Spacer(1, 6))
            desc_text = Paragraph(complaint_data['description'], style_normal)
            story.append(desc_text)
        
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def generate_analytics_report(analytics_data: Dict[str, Any]) -> BytesIO:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        
        story = []
        title = Paragraph("Analytics Report", styles['Heading1'])
        story.append(title)
        story.append(Spacer(1, 20))
        
        date_info = Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal'])
        story.append(date_info)
        story.append(Spacer(1, 20))
        
        data = [
            ['Metric', 'Value'],
            ['Total Complaints', str(analytics_data.get('total_complaints', 0))],
            ['Pending', str(analytics_data.get('pending_count', 0))],
            ['In Progress', str(analytics_data.get('in_progress_count', 0))],
            ['Resolved', str(analytics_data.get('resolved_count', 0))],
            ['Rejected', str(analytics_data.get('rejected_count', 0))],
        ]
        
        table = Table(data, colWidths=[250, 250])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(table)
        doc.build(story)
        buffer.seek(0)
        return buffer


export_service = ExportService()
