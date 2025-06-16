// src/features/files/components/CreateSubfolderModal.tsx
import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { createSubfolder } from '../services/S3Service';

interface CreateSubfolderModalProps {
  show: boolean;
  onHide: () => void;
  userId: string;
  currentPath: string;
  onFolderCreated: () => void;
}

const CreateSubfolderModal: React.FC<CreateSubfolderModalProps> = ({
  show,
  onHide,
  userId,
  currentPath,
  onFolderCreated
}) => {
  const [folderName, setFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!folderName.trim()) {
      setError('Please enter a folder name');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      await createSubfolder(userId, currentPath, folderName);
      setFolderName('');
      onFolderCreated();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (!creating) {
      setFolderName('');
      setError(null);
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-folder-plus me-2"></i>
          Create New Subfolder
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          <div className="mb-3">
            <Form.Label className="fw-bold">
              Current Location:
            </Form.Label>
            <div className="text-muted">
              <i className="bi bi-folder me-1"></i>
              {currentPath === '/' ? 'Root Directory' : currentPath}
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label htmlFor="folder-name">
              Folder Name <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              id="folder-name"
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
              disabled={creating}
              maxLength={50}
              required
            />
            <Form.Text className="text-muted">
              Only letters, numbers, hyphens, underscores, and spaces are allowed.
              Spaces will be converted to hyphens.
            </Form.Text>
          </Form.Group>

          {folderName && (
            <div className="mb-3">
              <Form.Label className="fw-bold">Preview:</Form.Label>
              <div className="bg-light p-2 rounded border">
                <i className="bi bi-folder me-1 text-primary"></i>
                {currentPath === '/' ? '/' : currentPath}
                <strong>{folderName.trim().toLowerCase().replace(/\s+/g, '-')}/</strong>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={creating}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={!folderName.trim() || creating}
          >
            {creating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Creating...
              </>
            ) : (
              <>
                <i className="bi bi-folder-plus me-2"></i>
                Create Folder
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateSubfolderModal;