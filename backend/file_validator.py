import magic
import os
from fastapi import UploadFile, HTTPException, status
from config import get_settings

settings = get_settings()


ALLOWED_MIME_TYPES = {
    '.jpg': ['image/jpeg'],
    '.jpeg': ['image/jpeg'],
    '.png': ['image/png'],
    '.pdf': ['application/pdf'],
    '.doc': ['application/msword'],
    '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
}


async def validate_upload_file(file: UploadFile) -> bool:
    if file.size is None:
        file.file.seek(0, 2)
        file.size = file.file.tell()
        file.file.seek(0)
    
    max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file.size > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB"
        )
    
    file_extension = os.path.splitext(file.filename)[1].lower()
    allowed_extensions = [ext.strip() for ext in settings.ALLOWED_UPLOAD_EXTENSIONS.split(',')]
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    content = await file.read(8192)
    await file.seek(0)
    
    mime = magic.Magic(mime=True)
    detected_mime = mime.from_buffer(content)
    
    expected_mimes = ALLOWED_MIME_TYPES.get(file_extension, [])
    if expected_mimes and detected_mime not in expected_mimes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File content does not match extension. Detected: {detected_mime}"
        )
    
    return True
