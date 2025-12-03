import React, { useState, useRef, useEffect } from 'react';
import './Profile.css';

const Profile = ({
  user = {},
  onUpdateProfile,  // gọi khi bấm Save
}) => {
  const {
    name = 'Your Name',
    role = 'User',
    email = 'user@example.com',
    avatarURL = '',
  } = user;

  const [avatar, setAvatar] = useState(avatarURL); // avatar đang xem trong profile
  const [profileName, setProfileName] = useState(name);
  const [mode, setMode] = useState('view'); // 'view' | 'edit'
  const fileRef = useRef(null);

  // sync khi prop thay đổi (vd: sau khi Dashboard cập nhật)
  useEffect(() => {
    setProfileName(name);
  }, [name]);

  useEffect(() => {
    setAvatar(avatarURL);
  }, [avatarURL]);

  // initials từ tên: "Nguyễn Văn A" -> "NA"
  const initials =
    name
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0].toUpperCase())
      .slice(0, 2)
      .join('') || 'U';

  const openFilePicker = () => {
    if (fileRef.current) fileRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Đọc file thành base64, chỉ preview trong Profile
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result; // base64 string
      setAvatar(dataUrl);
      // KHÔNG báo lên Dashboard ở đây → header chưa đổi, chỉ đổi khi Save
    };
    reader.readAsDataURL(file);
  };

  const handleStartEdit = () => {
    setProfileName(name);      // reset theo dữ liệu hiện tại
    setAvatar(avatarURL);      // reset avatar preview về avatar đang dùng
    setMode('edit');
  };

  const handleSave = () => {
    if (onUpdateProfile) {
      onUpdateProfile({
        ...user,
        name: profileName,
        avatarURL: avatar,
      });
    }
    setMode('view');
  };

  const handleCancel = () => {
    setProfileName(name);
    setAvatar(avatarURL);
    setMode('view');
  };

  return (
    <div className="profile-page">
      {/* Header nhỏ phía trên profile */}
      <div className="profile-header-row">
        <div className="profile-header-left">
          <h2 className="profile-title">Account Profile</h2>
          <p className="profile-subtitle">View and update your account info</p>
        </div>

        {mode === 'view' && (
          <button
            type="button"
            className="profile-edit-btn"
            onClick={handleStartEdit}
          >
            Edit
          </button>
        )}
      </div>

      {/* Card chính hiển thị avatar + info */}
      <div className="profile-card">
        <div className="profile-avatar">
          {avatar ? (
            <img src={avatar} alt="avatar" />
          ) : (
            <div className="profile-avatar-placeholder">{initials}</div>
          )}

          {/* Edit Image CHỈ hiện khi đang edit */}
          {mode === 'edit' && (
            <>
              <button
                type="button"
                className="edit-btn"
                onClick={openFilePicker}
              >
                Edit Image
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </>
          )}
        </div>

        <div className="profile-info">
          {/* Name */}
          <div className="info-row">
            <span className="label">Name</span>
            {mode === 'edit' ? (
              <input
                className="value-input"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
            ) : (
              <span className="value">{profileName}</span>
            )}
          </div>

          {/* Role – pill viền xanh, không edit */}
          <div className="info-row">
            <span className="label">Role</span>
            <span className="value value-role-pill">{role}</span>
          </div>

          {/* Email – giữ nguyên */}
          <div className="info-row">
            <span className="label">Email</span>
            <span className="value">{email}</span>
          </div>

          {/* Nút Save / Cancel khi edit */}
          {mode === 'edit' && (
            <div className="profile-edit-actions">
              <button
                type="button"
                className="profile-save-btn"
                onClick={handleSave}
              >
                Save
              </button>
              <button
                type="button"
                className="profile-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
