'use client';

interface ModalProps {
  id: string;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'lg' | 'xl';
  onClose?: () => void;
}

export default function Modal({ id, title, children, size, onClose }: ModalProps) {
  const sizeClass = size ? `modal-${size}` : '';

  return (
    <div className="modal fade" id={id} tabIndex={-1} aria-labelledby={`${id}Label`} aria-hidden="true">
      <div className={`modal-dialog ${sizeClass}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id={`${id}Label`}>
              {title}
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Tutup"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  );
}

