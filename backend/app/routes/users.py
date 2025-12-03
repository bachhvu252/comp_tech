from flask import Blueprint, jsonify
from app.models.user import User
from app.middleware.auth import roles_required

users_bp = Blueprint('users', __name__)


@users_bp.route('', methods=['GET'])
@roles_required('admin')
def get_users(current_user):
    try:
        users = User.query.order_by(User.created_at.asc()).all()
        users_list = [u.to_dict() for u in users]
        return jsonify({
            'success': True,
            'count': len(users_list),
            'users': users_list
        })
    except Exception as e:
        print(f"Get users error: {e}")
        return jsonify({'success': False, 'message': 'Server error'}), 500
