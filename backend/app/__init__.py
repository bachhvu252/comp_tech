from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()

def create_app():
    app = Flask(__name__)
    
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'mysql+pymysql://root:@localhost/wiki_kb')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 86400
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'
    app.config['JWT_ALGORITHM'] = 'HS256' 
    
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    
    # FIXED CORS - Allow credentials and all headers
    CORS(app, 
         origins=['http://localhost:5173', 'http://127.0.0.1:5173'],
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    
    with app.app_context():
        from app.models import User, Document, Revision
        db.create_all()
        print(" Database tables created successfully!")
    
    from app.routes.auth import auth_bp
    from app.routes.documents import documents_bp
    from app.routes.users import users_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(documents_bp, url_prefix='/api/documents')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    
    @app.route('/api/health')
    def health():
        return {'status': 'OK', 'message': 'Wiki KB Python API (MySQL) is running'}
    
    @app.route('/api/debug/token')
    def debug_token():
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            return {'success': True, 'verified': True, 'user_id': user_id}
        except Exception as e:
            return {'success': False, 'verified': False, 'error': str(e)}, 401
    
    return app