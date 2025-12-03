from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from app.models.user import User
from app.middleware.auth import token_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        role = data.get('role', 'viewer')
        
        if not name or len(name) < 2:
            return jsonify({'success': False, 'message': 'Name must be at least 2 characters'}), 400
        
        if not email or '@' not in email:
            return jsonify({'success': False, 'message': 'Valid email is required'}), 400
        
        if not password or len(password) < 6:
            return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400
        
        if User.find_by_email(email):
            return jsonify({'success': False, 'message': 'User with this email already exists'}), 400
        
        user = User.create_user(name, email, password, role)
        
        token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'success': True,
            'token': token,
            'user': user.to_dict()
        }), 201
    
    except Exception as e:
        print(f"Register error: {e}")
        return jsonify({'success': False, 'message': 'Server error during registration'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password are required'}), 400
        
        user = User.find_by_email(email)
        if not user:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        if not user.check_password(password):
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'success': True,
            'token': token,
            'user': user.to_dict()
        })
    
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'success': False, 'message': 'Server error during login'}), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_me(current_user):
    return jsonify({
        'success': True,
        'user': current_user.to_dict()
    })