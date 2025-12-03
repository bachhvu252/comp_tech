from datetime import datetime
from app import db, bcrypt

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('admin', 'editor', 'viewer'), default='viewer', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    documents = db.relationship('Document', backref='owner', lazy=True, foreign_keys='Document.owner_id')
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def set_password(self, password):
        self.password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        return bcrypt.check_password_hash(self.password, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
    
    @staticmethod
    def create_user(name, email, password, role='viewer'):
        user = User(
            name=name.strip(),
            email=email.lower().strip(),
            role=role if role in ['admin', 'editor', 'viewer'] else 'viewer'
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user
    
    @staticmethod
    def find_by_email(email):
        return User.query.filter_by(email=email.lower().strip()).first()
    
    @staticmethod
    def find_by_id(user_id):
        return User.query.get(user_id)