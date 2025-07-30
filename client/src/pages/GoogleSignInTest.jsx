import React, { useState } from 'react';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { signOutFromGoogle } from '../utils/auth/GoogleSignIn';
import { areTauriApisAvailable } from '../utils/platformDetection';

const GoogleSignInTest = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOutFromGoogle();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out: ' + error.toString());
    }
    setLoading(false);
  };

  const handleSuccess = (userData) => {
    setUser(userData);
    setError(null);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setUser(null);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>Google Sign-In Test {areTauriApisAvailable() ? '(Tauri)' : '(Web)'}</h1>

      {error && (
        <div style={{
          backgroundColor: '#ffdddd',
          color: '#d8000c',
          padding: '15px',
          marginBottom: '15px',
          borderRadius: '4px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {user ? (
        <div>
          <div style={{
            backgroundColor: '#dff2bf',
            color: '#4f8a10',
            padding: '15px',
            marginBottom: '15px',
            borderRadius: '4px'
          }}>
            <strong>Success!</strong> You are signed in.
          </div>

          <div style={{
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '15px',
            marginBottom: '15px'
          }}>
            <h3>User Profile:</h3>
            <p><strong>Name:</strong> {user.name || 'N/A'}</p>
            <p><strong>Email:</strong> {user.email || 'N/A'}</p>
            {user.profilePicture && (
              <div>
                <strong>Profile Picture:</strong><br/>
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  style={{ width: '100px', height: '100px', borderRadius: '50%', marginTop: '10px' }}
                />
              </div>
            )}
          </div>

          <button
            onClick={handleSignOut}
            disabled={loading}
            style={{
              backgroundColor: '#f44336',
              color: 'white',
              padding: '10px 15px',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'default' : 'pointer'
            }}
          >
            {loading ? 'Signing Out...' : 'Sign Out'}
          </button>
        </div>
      ) : (
        <div>
          <p>Click the button below to test Google Sign-In:</p>
          <GoogleSignInButton onSuccess={handleSuccess} onError={handleError} />
        </div>
      )}
    </div>
  );
};

export default GoogleSignInTest;
