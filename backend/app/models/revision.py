from datetime import datetime
from app import db

class Revision(db.Model):
    __tablename__ = 'revisions'
    
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('documents.id', ondelete='CASCADE'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    author_name = db.Column(db.String(50), nullable=False)
    author_email = db.Column(db.String(120), nullable=False)
    changes = db.Column(db.String(255), default='Content updated')
    
    added_lines = db.Column(db.Integer, default=0)
    removed_lines = db.Column(db.Integer, default=0)
    modified_lines = db.Column(db.Integer, default=0)
    total_lines = db.Column(db.Integer, default=0)
    
    restored_from_id = db.Column(db.Integer, db.ForeignKey('revisions.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    author = db.relationship('User', foreign_keys=[author_id])
    restored_from = db.relationship('Revision', remote_side=[id], backref='restored_versions')
    
    def __repr__(self):
        return f'<Revision {self.id} for Document {self.document_id}>'
    
    def to_dict(self):
        return {
            '_id': str(self.id),
            'content': self.content,
            'title': self.title,
            'authorId': str(self.author_id),
            'authorName': self.author_name,
            'authorEmail': self.author_email,
            'changes': self.changes,
            'diff': {
                'added': self.added_lines,
                'removed': self.removed_lines,
                'modified': self.modified_lines,
                'totalLines': self.total_lines
            },
            'restoredFrom': str(self.restored_from_id) if self.restored_from_id else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }