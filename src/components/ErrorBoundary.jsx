import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 mb-6">
                            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-300" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Something went wrong
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            We encountered an unexpected error. Please try reloading the page.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="text-left bg-gray-100 dark:bg-gray-900 p-4 rounded mb-6 overflow-auto max-h-40 text-xs text-red-600 font-mono">
                                {this.state.error.toString()}
                            </div>
                        )}

                        <button
                            onClick={this.handleReload}
                            className="inline-flex items-center w-full justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white btn-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
