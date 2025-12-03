from flask import Blueprint, request, jsonify
from app.models.document import Document
from app.middleware.auth import token_required, roles_required

documents_bp = Blueprint('documents', __name__)

@documents_bp.route('', methods=['GET'])
@token_required
def get_documents(current_user):
    try:
        documents = Document.find_all_accessible(current_user.id, current_user.role)
        
        docs_list = []
        for doc in documents:
            doc_dict = doc.to_dict(include_revisions=False)
            doc_dict['revision_count'] = len(doc.revisions)
            docs_list.append(doc_dict)
        
        return jsonify({
            'success': True,
            'count': len(docs_list),
            'documents': docs_list
        })
    
    except Exception as e:
        print(f"Get documents error: {e}")
        return jsonify({'success': False, 'message': 'Server error'}), 500

@documents_bp.route('/<int:doc_id>', methods=['GET'])
@token_required
def get_document(doc_id, current_user):
    try:
        doc = Document.query.get(doc_id)
        if not doc:
            return jsonify({'success': False, 'message': 'Document not found'}), 404
        
        if not Document.can_view(doc, current_user.id, current_user.role):
            return jsonify({'success': False, 'message': 'Not authorized to view'}), 403
        
        return jsonify({
            'success': True,
            'document': doc.to_dict()
        })
    
    except Exception as e:
        print(f"Get document error: {e}")
        return jsonify({'success': False, 'message': 'Server error'}), 500

@documents_bp.route('', methods=['POST'])
@roles_required('admin', 'editor')
def create_document(current_user):
    try:
        data = request.get_json() or {}
        
        title = data.get('title', 'New Document')
        content = data.get('content', '# New Document\\n\\nStart writing here...')
        is_public = data.get('is_public', True)
        
        doc = Document.create_document(
            title, content, 
            current_user.id, current_user.name, current_user.email, 
            is_public
        )
        
        return jsonify({
            'success': True,
            'document': doc.to_dict()
        }), 201
    
    except Exception as e:
        print(f"Create document error: {e}")
        return jsonify({'success': False, 'message': 'Server error'}), 500

@documents_bp.route('/<int:doc_id>', methods=['PUT'])
@token_required
def update_document(doc_id, current_user):
    try:
        doc = Document.query.get(doc_id)
        if not doc:
            return jsonify({'success': False, 'message': 'Document not found'}), 404
        
        if not Document.can_edit(doc, current_user.id, current_user.role):
            return jsonify({'success': False, 'message': 'Not authorized to edit'}), 403
        
        data = request.get_json() or {}
        title = data.get('title', doc.title)
        content = data.get('content', doc.content)
        
        updated_doc = Document.update_document(
            doc, title, content, 
            current_user.id, current_user.name, current_user.email
        )
        
        return jsonify({
            'success': True,
            'document': updated_doc.to_dict()
        })
    
    except Exception as e:
        print(f"Update document error: {e}")
        return jsonify({'success': False, 'message': 'Server error'}), 500

@documents_bp.route('/<int:doc_id>', methods=['DELETE'])
@token_required
def delete_document(doc_id, current_user):
    try:
        doc = Document.query.get(doc_id)
        if not doc:
            return jsonify({'success': False, 'message': 'Document not found'}), 404
        
        if not Document.can_delete(doc, current_user.id, current_user.role):
            return jsonify({'success': False, 'message': 'Not authorized to delete'}), 403
        
        from app import db
        db.session.delete(doc)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Document deleted'})
    
    except Exception as e:
        print(f"Delete document error: {e}")
        return jsonify({'success': False, 'message': 'Server error'}), 500

@documents_bp.route('/<int:doc_id>/restore/<int:revision_id>', methods=['POST'])
@token_required
def restore_revision(doc_id, revision_id, current_user):
    try:
        doc = Document.query.get(doc_id)
        if not doc:
            return jsonify({'success': False, 'message': 'Document not found'}), 404
        
        if not Document.can_edit(doc, current_user.id, current_user.role):
            return jsonify({'success': False, 'message': 'Not authorized to edit'}), 403
        
        updated_doc = Document.restore_revision(
            doc, revision_id, 
            current_user.id, current_user.name, current_user.email
        )
        
        if not updated_doc:
            return jsonify({'success': False, 'message': 'Revision not found'}), 404
        
        return jsonify({
            'success': True,
            'document': updated_doc.to_dict()
        })
    
    except Exception as e:
        print(f"Restore revision error: {e}")
        return jsonify({'success': False, 'message': 'Server error'}), 500