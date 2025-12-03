from datetime import datetime
from app import db
from app.models.revision import Revision

class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False, default='')
    
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    owner_name = db.Column(db.String(50), nullable=False)
    owner_email = db.Column(db.String(120), nullable=False)
    
    editors = db.Column(db.Text, default='')
    viewers = db.Column(db.Text, default='')
    
    last_edited_by = db.Column(db.String(50), default='')
    is_public = db.Column(db.Boolean, default=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    revisions = db.relationship('Revision', backref='document', lazy=True, 
                                cascade='all, delete-orphan', 
                                order_by='Revision.created_at')
    
    def __repr__(self):
        return f'<Document {self.title}>'
    
    def get_editors_list(self):
        if not self.editors:
            return [self.owner_id]
        return [int(id) for id in self.editors.split(',') if id]
    
    def set_editors_list(self, editor_ids):
        self.editors = ','.join([str(id) for id in editor_ids])
    
    def get_viewers_list(self):
        if not self.viewers:
            return []
        return [int(id) for id in self.viewers.split(',') if id]
    
    def set_viewers_list(self, viewer_ids):
        self.viewers = ','.join([str(id) for id in viewer_ids])
    
    def to_dict(self, include_revisions=True):
        data = {
            '_id': str(self.id),
            'title': self.title,
            'content': self.content,
            'ownerId': str(self.owner_id),
            'ownerName': self.owner_name,
            'ownerEmail': self.owner_email,
            'editors': self.get_editors_list(),
            'viewers': self.get_viewers_list(),
            'lastEditedBy': self.last_edited_by,
            'isPublic': self.is_public,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_revisions:
            data['revisions'] = [rev.to_dict() for rev in self.revisions]
        
        return data
    
    @staticmethod
    def calculate_diff(old_text, new_text):
        old_lines = (old_text or '').split('\\n')
        new_lines = (new_text or '').split('\\n')
        
        added = removed = modified = 0
        max_len = max(len(old_lines), len(new_lines))
        
        for i in range(max_len):
            if i >= len(old_lines):
                added += 1
            elif i >= len(new_lines):
                removed += 1
            elif old_lines[i] != new_lines[i]:
                modified += 1
        
        return {
            'added': added,
            'removed': removed,
            'modified': modified,
            'total_lines': len(new_lines)
        }
    
    @staticmethod
    def create_document(title, content, owner_id, owner_name, owner_email, is_public=True):
        doc = Document(
            title=title,
            content=content,
            owner_id=owner_id,
            owner_name=owner_name,
            owner_email=owner_email,
            last_edited_by=owner_name,
            is_public=is_public
        )
        doc.set_editors_list([owner_id])
        
        diff = Document.calculate_diff('', content)
        
        revision = Revision(
            content=content,
            title=title,
            author_id=owner_id,
            author_name=owner_name,
            author_email=owner_email,
            changes='Document created',
            added_lines=diff['added'],
            removed_lines=diff['removed'],
            modified_lines=diff['modified'],
            total_lines=diff['total_lines']
        )
        
        doc.revisions.append(revision)
        
        db.session.add(doc)
        db.session.commit()
        
        return doc
    
    @staticmethod
    def update_document(doc, title, content, user_id, user_name, user_email):
        diff = Document.calculate_diff(doc.content, content)
        
        changes = []
        if doc.title != title:
            changes.append('Title changed')
        if diff['added'] > 0:
            changes.append(f"+{diff['added']}")
        if diff['removed'] > 0:
            changes.append(f"-{diff['removed']}")
        if diff['modified'] > 0:
            changes.append(f"~{diff['modified']}")
        
        change_summary = ', '.join(changes) if changes else 'Minor edits'
        
        revision = Revision(
            content=content,
            title=title,
            author_id=user_id,
            author_name=user_name,
            author_email=user_email,
            changes=change_summary,
            added_lines=diff['added'],
            removed_lines=diff['removed'],
            modified_lines=diff['modified'],
            total_lines=diff['total_lines']
        )
        
        doc.title = title
        doc.content = content
        doc.last_edited_by = user_name
        doc.updated_at = datetime.utcnow()
        doc.revisions.append(revision)
        
        db.session.commit()
        
        return doc
    
    @staticmethod
    def restore_revision(doc, revision_id, user_id, user_name, user_email):
        revision = Revision.query.get(revision_id)
        if not revision or revision.document_id != doc.id:
            return None
        
        diff = Document.calculate_diff(doc.content, revision.content)
        
        new_revision = Revision(
            content=revision.content,
            title=revision.title,
            author_id=user_id,
            author_name=user_name,
            author_email=user_email,
            changes=f"Restored from {revision.created_at.strftime('%Y-%m-%d')}",
            added_lines=diff['added'],
            removed_lines=diff['removed'],
            modified_lines=diff['modified'],
            total_lines=diff['total_lines'],
            restored_from_id=revision.id
        )
        
        doc.title = revision.title
        doc.content = revision.content
        doc.last_edited_by = user_name
        doc.updated_at = datetime.utcnow()
        doc.revisions.append(new_revision)
        
        db.session.commit()
        
        return doc
    
    @staticmethod
    def can_edit(doc, user_id, user_role):
        if user_role == 'admin':
            return True
        if doc.owner_id == user_id:
            return True
        if user_id in doc.get_editors_list():
            return True
        return False
    
    @staticmethod
    def can_view(doc, user_id, user_role):
        if user_role == 'admin':
            return True
        if doc.owner_id == user_id:
            return True
        if user_id in doc.get_editors_list():
            return True
        if user_id in doc.get_viewers_list():
            return True
        if doc.is_public:
            return True
        return False
    
    @staticmethod
    def can_delete(doc, user_id, user_role):
        if user_role == 'admin':
            return True
        if doc.owner_id == user_id:
            return True
        return False
    
    @staticmethod
    def find_all_accessible(user_id, user_role):
        if user_role == 'admin':
            return Document.query.order_by(Document.updated_at.desc()).all()
        else:
            return Document.query.filter(
                db.or_(
                    Document.owner_id == user_id,
                    Document.editors.like(f'%{user_id}%'),
                    Document.viewers.like(f'%{user_id}%'),
                    Document.is_public == True
                )
            ).order_by(Document.updated_at.desc()).all()