from sqlalchemy.orm import Session
from typing import List, Tuple
from models import Complaint, ComplaintStatus
from difflib import SequenceMatcher
from datetime import datetime, timedelta


def calculate_text_similarity(text1: str, text2: str) -> float:
    if not text1 or not text2:
        return 0.0
    
    text1_lower = text1.lower().strip()
    text2_lower = text2.lower().strip()
    
    return SequenceMatcher(None, text1_lower, text2_lower).ratio()


def find_similar_complaints(
    db: Session,
    title: str,
    category_id: int,
    description: str = "",
    summary: str = "",
    similarity_threshold: float = 0.6,
    limit: int = 5,
    days_back: int = 180
) -> List[Tuple[Complaint, float]]:
    cutoff_date = datetime.utcnow() - timedelta(days=days_back)
    
    same_category_complaints = db.query(Complaint).filter(
        Complaint.category_id == category_id,
        Complaint.created_at >= cutoff_date,
        Complaint.status.in_([
            ComplaintStatus.SUBMITTED,
            ComplaintStatus.UNDER_REVIEW,
            ComplaintStatus.ESCALATED,
            ComplaintStatus.MEDIATION_PENDING,
            ComplaintStatus.MEDIATION_IN_PROGRESS
        ])
    ).order_by(Complaint.created_at.desc()).limit(500).all()
    
    similar_complaints = []
    
    for complaint in same_category_complaints:
        title_similarity = calculate_text_similarity(title, complaint.title)
        
        if title_similarity >= similarity_threshold:
            score = title_similarity
            
            if description and complaint.description:
                desc_similarity = calculate_text_similarity(description, complaint.description)
                score = (title_similarity + desc_similarity) / 2
            
            if summary and complaint.complaint_summary:
                summary_similarity = calculate_text_similarity(summary, complaint.complaint_summary)
                score = (score + summary_similarity) / 2
            
            similar_complaints.append((complaint, score))
    
    similar_complaints.sort(key=lambda x: x[1], reverse=True)
    
    return similar_complaints[:limit]


def check_duplicate_warning(
    db: Session,
    title: str,
    category_id: int,
    description: str = "",
    summary: str = "",
    threshold: float = 0.7
) -> dict:
    similar = find_similar_complaints(
        db, title, category_id, description, summary,
        similarity_threshold=threshold, limit=3
    )
    
    if not similar:
        return {
            "has_duplicates": False,
            "similar_complaints": []
        }
    
    similar_list = []
    for complaint, score in similar:
        similar_list.append({
            "id": complaint.id,
            "title": complaint.title,
            "status": complaint.status.value,
            "created_at": complaint.created_at.isoformat(),
            "similarity_score": round(score, 2)
        })
    
    return {
        "has_duplicates": True,
        "similar_complaints": similar_list,
        "message": "تحذير: تم العثور على شكاوى مشابهة. يرجى التحقق قبل التقديم."
    }
