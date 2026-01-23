import PropTypes from 'prop-types';
import './Input.css';

export default function Input({
    label,
    error,
    id,
    className = '',
    ...props
}) {
    return (
        <div className={`input-group ${className}`}>
            {label && <label htmlFor={id} className="input-label">{label}</label>}
            <input
                id={id}
                className={`input-field ${error ? 'input-error' : ''}`}
                {...props}
            />
            {error && <span className="input-error-message">{error}</span>}
        </div>
    );
}

Input.propTypes = {
    label: PropTypes.string,
    error: PropTypes.string,
    id: PropTypes.string.isRequired,
    className: PropTypes.string,
};
