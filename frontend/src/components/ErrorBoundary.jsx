import { Component } from 'react';
import { PrimaryButton, SecondaryButton } from './ui/Button.jsx';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[YOLO ErrorBoundary]', error, info);
  }

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
          <div className="max-w-md w-full rounded-3xl yolo-error-state px-8 py-10 text-center space-y-4">
            <h3 className="text-lg font-display font-semibold">Something went wrong</h3>
            <p className="text-sm opacity-90">
              {this.state.error.message ||
                'An unexpected error occurred while loading this page.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <PrimaryButton onClick={() => this.setState({ error: null })}>
                Try again
              </PrimaryButton>
              <SecondaryButton onClick={this.handleGoHome}>Go home</SecondaryButton>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
