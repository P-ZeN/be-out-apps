import React from 'react';

class PaymentErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Payment Error Boundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="payment-error-boundary">
                    <div className="error-content">
                        <h3>Payment System Error</h3>
                        <p>Sorry, there was an error loading the payment system.</p>
                        <details style={{ marginTop: '1rem' }}>
                            <summary>Error Details</summary>
                            <pre style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                {this.state.error?.message || 'Unknown error'}
                            </pre>
                        </details>
                        <div className="error-actions" style={{ marginTop: '1rem' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    this.setState({ hasError: false, error: null });
                                    if (this.props.onRetry) {
                                        this.props.onRetry();
                                    }
                                }}
                            >
                                Try Again
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={this.props.onClose}
                                style={{ marginLeft: '0.5rem' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default PaymentErrorBoundary;
