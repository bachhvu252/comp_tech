def validate_email(email):
    if not email:
        return False
    return '@' in email and '.' in email.split('@')[1]

def sanitize_string(text, max_length=None):
    if not text:
        return ''
    text = text.strip()
    if max_length and len(text) > max_length:
        text = text[:max_length]
    return text

def format_file_size(size_bytes):
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.2f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.2f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"